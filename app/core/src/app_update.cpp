#include "srp/core/app_update.h"
#include "json_reader.h"
#include <array>
#include <charconv>
#include <chrono>
#include <limits>
#include <filesystem>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#endif
#ifndef SRP_APP_VERSION
#error SRP_APP_VERSION must be supplied by the build
#endif
namespace srp::core {
namespace {
bool versionParts(const std::string& text, std::array<unsigned,3>& parts) {
    size_t start = text.size() && text.front()=='v' ? 1 : 0;
    for (size_t i=0;i<parts.size();++i) {
        const auto end = text.find('.',start);
        const auto count = (end==std::string::npos ? text.size() : end)-start;
        if (!count || count>9 || (count>1 && text[start]=='0')) return false;
        const char* first=text.data()+start;const char* last=first+count;
        for(auto* c=first;c!=last;++c)if(*c<'0'||*c>'9')return false;
        const auto parsed=std::from_chars(first,last,parts[i]);
        if(parsed.ec!=std::errc()||parsed.ptr!=last)return false;
        if(i==2)return end==std::string::npos;
        if(end==std::string::npos)return false;start=end+1;
    }
    return false;
}
#if defined(_WIN32)
struct Handle { HINTERNET h=nullptr; ~Handle(){if(h)WinHttpCloseHandle(h);} };
bool fetchManifest(std::string& text) {
    Handle session{WinHttpOpen(L"SrP-CFG Update Check",WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,nullptr,nullptr,0)};
    if(!session.h)return false;
    WinHttpSetTimeouts(session.h,5000,5000,10000,10000);
    Handle connection{WinHttpConnect(session.h,L"github.com",INTERNET_DEFAULT_HTTPS_PORT,0)};
    Handle request{connection.h?WinHttpOpenRequest(connection.h,L"GET",L"/RolinShmily/SrP-CFG_ForCS2/releases/latest/download/latest.json",nullptr,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,WINHTTP_FLAG_SECURE):nullptr};
    if(!request.h)return false;
    // GitHub latest/download redirects to versioned assets and release-assets.githubusercontent.com.
    // WinHTTP validates TLS and never follows an HTTPS-to-HTTP redirect.
    DWORD policy=WINHTTP_OPTION_REDIRECT_POLICY_DISALLOW_HTTPS_TO_HTTP,maxRedirects=5;
    WinHttpSetOption(request.h,WINHTTP_OPTION_REDIRECT_POLICY,&policy,sizeof(policy));
    WinHttpSetOption(request.h,WINHTTP_OPTION_MAX_HTTP_AUTOMATIC_REDIRECTS,&maxRedirects,sizeof(maxRedirects));
    if(!WinHttpSendRequest(request.h,L"Cache-Control: no-cache\r\n",static_cast<DWORD>(-1),nullptr,0,0,0)||!WinHttpReceiveResponse(request.h,nullptr))return false;
    DWORD status=0,size=sizeof(status);
    if(!WinHttpQueryHeaders(request.h,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,WINHTTP_HEADER_NAME_BY_INDEX,&status,&size,WINHTTP_NO_HEADER_INDEX)||status!=200)return false;
    const auto deadline=std::chrono::steady_clock::now()+std::chrono::seconds(30);
    char buffer[4096];DWORD got=0;
    while(std::chrono::steady_clock::now()<deadline){
        if(!WinHttpReadData(request.h,buffer,sizeof(buffer),&got))return false;
        if(!got)return true;
        if(text.size()+got>256*1024)return false;text.append(buffer,got);
    }
    return false;
}
#endif
}
std::string applicationVersion(){return SRP_APP_VERSION;}
std::string websiteUrl(){return "https://cfg.srprolin.top";}
std::string blogUrl(){return "https://blog.srprolin.top";}
std::string projectUrl(){return "https://github.com/RolinShmily/SrP-CFG_ForCS2";}
std::string releasesUrl(){return projectUrl()+"/releases";}
std::string appReleaseManifestUrl(){return releasesUrl()+"/latest/download/latest.json";}
bool compareAppVersions(const std::string& candidate,const std::string& current,bool& newer){
    std::array<unsigned,3>a{},b{};newer=false;if(!versionParts(candidate,a)||!versionParts(current,b))return false;newer=a>b;return true;
}
bool parseAppRelease(const std::string& text,AppRelease& release){
    release={};
    try {
        if(text.size()>256*1024)return false;
        const auto doc=detail::JsonParser(text).parse();if(doc.type!='{')return false;
        auto string=[&](const char* key,bool required){auto it=doc.object.find(key);if(it==doc.object.end()){if(required)throw std::runtime_error("Missing version");return std::string();}if(it->second.type!='"'||it->second.scalar.size()>8192)throw std::runtime_error("Invalid field");return it->second.scalar;};
        AppRelease result;result.version=string("version",true);result.tag=string("tag",true);
        bool unused=false;if(result.version.empty()||result.version.front()=='v'||!compareAppVersions(result.version,applicationVersion(),unused)||result.tag!="v"+result.version)return false;
        result.publishedAt=string("published_at",false);result.notesZh=string("notes_zh",false);result.notesEn=string("notes_en",false);
        release=std::move(result);return true;
    }catch(const std::runtime_error&){return false;}
}
AppUpdateResult checkAppUpdate(){
    AppUpdateResult result;
#if defined(_WIN32)
    std::string text;if(!fetchManifest(text)){result.error="appupdate.network_failed";return result;}
    if(!parseAppRelease(text,result.release)||!compareAppVersions(result.release.version,applicationVersion(),result.updateAvailable)){result.error="appupdate.invalid_manifest";return result;}
    result.success=true;
#else
    result.error="appupdate.unsupported";
#endif
    return result;
}
}
