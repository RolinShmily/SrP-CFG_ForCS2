#include "srp/core/catalog.h"
#include "srp/core/actions.h"
#include "json_reader.h"
#include <filesystem>
#include <fstream>
#include <regex>
#include <set>
#include <algorithm>
#include <cctype>
namespace srp::core {
namespace fs=std::filesystem;
namespace {
std::string read(const fs::path& p){std::ifstream f(p,std::ios::binary);if(!f)return {};return {std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>()};}
std::string field(const detail::Json& obj,const char* key,bool required=false){auto it=obj.object.find(key);if(it==obj.object.end()){if(required)throw std::runtime_error("Missing catalog field");return {};}if(it->second.type!='"')throw std::runtime_error("Invalid catalog field");return it->second.scalar;}
std::vector<std::string> strings(const detail::Json& obj,const char* key){std::vector<std::string> out;auto it=obj.object.find(key);if(it==obj.object.end())return out;if(it->second.type!='[')throw std::runtime_error("Invalid catalog list");for(const auto& value:it->second.array){if(value.type!='"')throw std::runtime_error("Invalid catalog list");out.push_back(value.scalar);}return out;}
std::string mapName(const fs::path& p){const auto text=read(p);std::smatch m;return std::regex_search(text,m,std::regex(R"re(\bMapName\s*=\s*"([a-z0-9_]+)")re"))?m[1].str():std::string();}
std::string discoverAlias(const fs::path& root,const std::string& file){
    const auto content=read(root/"runtime/commands.cfg");
    const std::regex alias(R"re(alias\s+"([a-zA-Z0-9_]+)"\s+"exec\s+([^"\r\n]+)")re");
    for(std::sregex_iterator it(content.begin(),content.end(),alias),end;it!=end;++it)if((*it)[2].str()=="srp-cfg/"+file)return (*it)[1].str();
    return {};
}
void validate(CatalogEntry& e,const std::string& package,const fs::path& root){
    if(!catalogIdentifier(e.id)||e.name.empty()||e.name.size()>160||!catalogSafePath(e.directory)||e.files.empty())throw std::runtime_error("Invalid catalog entry");
    if(package=="srp-cfg"){
        if(e.category!="presets"&&e.category!="features"&&e.category!="modes")throw std::runtime_error("Invalid category");
        if(e.directory.rfind(e.category+"/",0)!=0||!catalogIdentifier(e.command)||e.command=="srp_reset_valve"||e.command=="srp_reload")throw std::runtime_error("Invalid command or directory");
        if(!e.keymapCommand.empty()&&!catalogIdentifier(e.keymapCommand))throw std::runtime_error("Invalid keymap command");
        if(std::find(e.files.begin(),e.files.end(),"settings.cfg")==e.files.end())throw std::runtime_error("Settings required");
        if(!e.keymapCommand.empty()&&(std::find(e.files.begin(),e.files.end(),"keymap.cfg")==e.files.end()||!fs::is_regular_file(root/e.directory/"with-keymap.cfg")))throw std::runtime_error("Keymap files required");
        if(!catalogEntryAvailable(e,root.u8string(),!e.keymapCommand.empty()))throw std::runtime_error("Catalog command not registered");
    }else if(package=="annotations"){
        e.category="annotations";
        if(!catalogIdentifier(e.directory)||!catalogIdentifier(e.map)||e.files.size()!=1||e.files[0]!=e.directory+".txt")throw std::runtime_error("Invalid guide map or file");
    }else throw std::runtime_error("Invalid package");
    std::set<std::string> paths;
    for(const auto& file:e.files){
        if(!catalogSafePath(file)||!paths.insert(file).second)throw std::runtime_error("Invalid file path");
        if(package=="srp-cfg"&&fs::u8path(file).extension()!=".cfg")throw std::runtime_error("CFG required");
        const auto path=root/fs::u8path(e.directory)/fs::u8path(file);
        auto ancestor=root;for(const auto& part:fs::u8path(e.directory+"/"+file)){ancestor/=part;if(fs::is_symlink(ancestor))throw std::runtime_error("Links forbidden");}
        if(!fs::is_regular_file(path)||fs::is_symlink(path))throw std::runtime_error("Catalog file missing");
    }
}
}
bool catalogIdentifier(const std::string& id){return !id.empty()&&id.size()<=96&&std::all_of(id.begin(),id.end(),[](unsigned char c){return (c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c=='_'||c=='-';});}
bool catalogSafePath(const std::string& rel){
    if(rel.empty()||rel.front()=='/'||rel.find_first_of("\\:\r\n<>\"|?*")!=std::string::npos||rel.find('\0')!=std::string::npos)return false;
    for(const auto& part:fs::u8path(rel)){auto s=part.u8string();if(s.empty()||s=="."||s==".."||s.back()=='.'||s.back()==' ')return false;
        auto base=s.substr(0,s.find('.'));std::transform(base.begin(),base.end(),base.begin(),[](unsigned char c){return static_cast<char>(std::toupper(c));});
        if(base=="CON"||base=="PRN"||base=="AUX"||base=="NUL"||(base.size()==4&&(base.rfind("COM",0)==0||base.rfind("LPT",0)==0)&&base[3]>='1'&&base[3]<='9'))return false;
    }
    return true;
}
ConfigCatalog readConfigCatalog(const std::string& package,const std::string& directory){
    ConfigCatalog catalog;
    try{
        const auto root=fs::u8path(directory);if(directory.empty()||!fs::is_directory(root))return {false,"pkg.invalid_catalog",{}};
        const auto file=root/"catalog.json";
        if(fs::exists(file)){
            const auto doc=detail::JsonParser(read(file)).parse();
            if(doc.object.at("schema_version").type!='1'||doc.object.at("schema_version").scalar!="1"||doc.object.at("entries").type!='[')throw std::runtime_error("Invalid catalog schema");
            for(const auto& item:doc.object.at("entries").array){
                CatalogEntry e;e.id=field(item,"id",true);e.name=field(item,"name",true);e.category=field(item,"category");e.directory=field(item,"directory",true);
                e.command=field(item,"command");e.keymapCommand=field(item,"keymap_command");e.map=field(item,"map");e.files=strings(item,"files");
                e.descriptionZh=field(item,"description_zh");e.descriptionEn=field(item,"description_en");e.tagsZh=strings(item,"tags_zh");e.tagsEn=strings(item,"tags_en");
                validate(e,package,root);catalog.entries.push_back(std::move(e));
            }
        }else{
            // Legacy packages: discover conventional directories, never a hard-coded list of IDs.
            const std::vector<std::string> categories=package=="srp-cfg"?std::vector<std::string>{"presets","features","modes"}:std::vector<std::string>{""};
            for(const auto& category:categories){
                const auto parent=category.empty()?root:root/category;if(!fs::is_directory(parent))continue;
                std::vector<fs::path> directories;for(const auto& entry:fs::directory_iterator(parent))if(entry.is_directory()&&!entry.is_symlink())directories.push_back(entry.path());std::sort(directories.begin(),directories.end());
                for(const auto& path:directories){
                    CatalogEntry e;e.id=path.filename().u8string();e.name=e.id;e.category=category;e.directory=path.lexically_relative(root).generic_u8string();
                    if(package=="srp-cfg"){
                        if(!fs::is_regular_file(path/"settings.cfg"))continue;
                        for(const auto* primary:{"settings.cfg","keymap.cfg"})if(fs::is_regular_file(path/primary))e.files.push_back(primary);
                        for(const auto& f:fs::directory_iterator(path))if(f.is_regular_file()&&f.path().extension()==".cfg"&&std::find(e.files.begin(),e.files.end(),f.path().filename().u8string())==e.files.end())e.files.push_back(f.path().filename().u8string());
                        e.command=discoverAlias(root,e.directory+(category=="presets"?"/apply.cfg":"/settings.cfg"));
                        if(e.command.empty())continue;
                        if(fs::is_regular_file(path/"keymap.cfg")&&fs::is_regular_file(path/"with-keymap.cfg"))e.keymapCommand=discoverAlias(root,e.directory+"/with-keymap.cfg");
                    }else{
                        auto text=path/(path.filename().u8string()+".txt");if(!fs::is_regular_file(text))continue;
                        e.files={text.filename().u8string()};e.map=mapName(text);if(e.map.empty())continue;
                        // Stable legacy ID follows the map, compatible with existing dust2/mirage commands.
                        e.id=e.map.rfind("de_",0)==0?e.map.substr(3):e.map;e.name=e.id;
                    }
                    validate(e,package,root);catalog.entries.push_back(std::move(e));
                }
            }
        }
        std::set<std::string> ids,files,commands;
        for(const auto& e:catalog.entries){
            auto id=e.id;std::transform(id.begin(),id.end(),id.begin(),[](unsigned char c){return static_cast<char>(std::tolower(c));});
            if(!ids.insert(id).second)throw std::runtime_error("Duplicate id");
            for(const auto& file:e.files) { auto path=e.directory+"/"+file;std::transform(path.begin(),path.end(),path.begin(),[](unsigned char c){return static_cast<char>(std::tolower(c));});if(!files.insert(path).second)throw std::runtime_error("Duplicate file"); }
            for(auto command:{e.command,e.keymapCommand}){std::transform(command.begin(),command.end(),command.begin(),[](unsigned char c){return static_cast<char>(std::tolower(c));});if(!command.empty()&&!commands.insert(command).second)throw std::runtime_error("Duplicate command");}
        }
        return catalog;
    }catch(const fs::filesystem_error&){return {false,"pkg.invalid_catalog",{}};}
     catch(const std::runtime_error&){return {false,"pkg.invalid_catalog",{}};}
     catch(const std::out_of_range&){return {false,"pkg.invalid_catalog",{}};}
}
std::vector<CatalogEntry> configCatalog(const std::string& package,const std::string& directory){
    auto source=directory;
    if(source.empty())source=(fs::u8path(findSourceConfigDir())/package).u8string();
    const auto metadata=fs::u8path(source)/"catalog.json";
    std::error_code ec;
    if(fs::is_regular_file(metadata,ec)){
        struct Cached{fs::file_time_type modified;uintmax_t size=0;std::vector<CatalogEntry> entries;};
        thread_local std::map<std::string,Cached> cache;
        const auto modified=fs::last_write_time(metadata,ec);const auto size=fs::file_size(metadata,ec);
        const auto key=package+":"+source;auto found=cache.find(key);
        if(!ec&&found!=cache.end()&&found->second.modified==modified&&found->second.size==size)return found->second.entries;
        const auto result=readConfigCatalog(package,source);
        if(result.success){if(cache.size()>32)cache.clear();cache[key]={modified,size,result.entries};return result.entries;}
        return {};
    }
    const auto result=readConfigCatalog(package,source);return result.success?result.entries:std::vector<CatalogEntry>();
}
bool catalogEntryAvailable(const CatalogEntry& entry,const std::string& directory,bool keys){
    try {
        const auto root=fs::u8path(directory);
        if(!fs::is_regular_file(root/entry.directory/"settings.cfg"))return false;
        const std::string primary=entry.directory+(entry.category=="presets"?"/apply.cfg":"/settings.cfg");
        if(discoverAlias(root,primary)!=entry.command)return false;
        return !keys || (!entry.keymapCommand.empty()&&fs::is_regular_file(root/entry.directory/"keymap.cfg")&&discoverAlias(root,entry.directory+"/with-keymap.cfg")==entry.keymapCommand);
    } catch(const fs::filesystem_error&){return false;}
}
bool catalogFileAllowed(const std::string& package,const std::string& relative,const std::string& directory){
    if(!catalogSafePath(relative))return false;
    for(const auto& e:configCatalog(package,directory))for(const auto& f:e.files)if(e.directory+"/"+f==relative)return true;
    return false;
}
}
