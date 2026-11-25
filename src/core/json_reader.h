#pragma once
#include <map>
#include <vector>
#include <string>
#include <stdexcept>
#include <cctype>
namespace srp::core::detail {
struct Json {
    std::map<std::string, Json> object;
    std::vector<Json> array;
    std::string scalar;
    char type = 0;
};
class JsonParser {
    const std::string& s; size_t pos = 0;
    void ws() { while (pos < s.size() && std::isspace(static_cast<unsigned char>(s[pos]))) ++pos; }
    char take() { if (pos == s.size()) throw std::runtime_error("Invalid JSON"); return s[pos++]; }
    unsigned hex4() {
        unsigned value = 0;
        for (int i=0;i<4;++i) { char c=take(); value*=16; if(c>='0'&&c<='9')value+=c-'0';else if(c>='a'&&c<='f')value+=c-'a'+10;else if(c>='A'&&c<='F')value+=c-'A'+10;else throw std::runtime_error("Invalid unicode"); }
        return value;
    }
    void utf8(std::string& out,unsigned n) {
        if(n<0x80)out+=static_cast<char>(n);
        else if(n<0x800){out+=static_cast<char>(0xc0|(n>>6));out+=static_cast<char>(0x80|(n&63));}
        else if(n<0x10000){out+=static_cast<char>(0xe0|(n>>12));out+=static_cast<char>(0x80|((n>>6)&63));out+=static_cast<char>(0x80|(n&63));}
        else{out+=static_cast<char>(0xf0|(n>>18));out+=static_cast<char>(0x80|((n>>12)&63));out+=static_cast<char>(0x80|((n>>6)&63));out+=static_cast<char>(0x80|(n&63));}
    }
    std::string string() {
        if(take()!='"')throw std::runtime_error("Invalid string");std::string out;
        for(;;){char c=take();if(c=='"')return out;if(static_cast<unsigned char>(c)<32)throw std::runtime_error("Invalid string");
            if(c!='\\'){out+=c;continue;}c=take();
            switch(c){case '"':case '\\':case '/':out+=c;break;case 'n':out+='\n';break;case 'r':out+='\r';break;case 't':out+='\t';break;case 'b':out+='\b';break;case 'f':out+='\f';break;
                case 'u':{unsigned n=hex4();if(n>=0xd800&&n<=0xdbff){if(take()!='\\'||take()!='u')throw std::runtime_error("Invalid surrogate");unsigned low=hex4();if(low<0xdc00||low>0xdfff)throw std::runtime_error("Invalid surrogate");n=0x10000+((n-0xd800)<<10)+(low-0xdc00);}else if(n>=0xdc00&&n<=0xdfff)throw std::runtime_error("Invalid surrogate");utf8(out,n);break;}
                default:throw std::runtime_error("Invalid escape");}
        }
    }
    Json value(int depth) {
        if(depth>32)throw std::runtime_error("JSON nesting limit");ws();if(pos==s.size())throw std::runtime_error("Invalid JSON");Json j;j.type=s[pos];
        if(s[pos]=='{'){++pos;ws();if(pos<s.size()&&s[pos]=='}'){++pos;return j;}for(;;){ws();auto key=string();ws();if(take()!=':')throw std::runtime_error("Invalid object");if(!j.object.emplace(key,value(depth+1)).second)throw std::runtime_error("Duplicate key");ws();char c=take();if(c=='}')return j;if(c!=',')throw std::runtime_error("Invalid object");}}
        if(s[pos]=='['){++pos;ws();if(pos<s.size()&&s[pos]==']'){++pos;return j;}for(;;){j.array.push_back(value(depth+1));if(j.array.size()>5000)throw std::runtime_error("Array limit");ws();char c=take();if(c==']')return j;if(c!=',')throw std::runtime_error("Invalid array");}}
        if(s[pos]=='"'){j.scalar=string();return j;}
        while(pos<s.size()&&s[pos]!=','&&s[pos]!='}'&&s[pos]!=']'&&!std::isspace(static_cast<unsigned char>(s[pos])))j.scalar+=s[pos++];
        if(j.scalar=="true"||j.scalar=="false"||j.scalar=="null")return j;
        const auto& n=j.scalar;size_t p=0;if(p<n.size()&&n[p]=='-')++p;if(p==n.size())throw std::runtime_error("Invalid scalar");
        if(n[p]=='0')++p;else{if(n[p]<'1'||n[p]>'9')throw std::runtime_error("Invalid number");while(p<n.size()&&std::isdigit(static_cast<unsigned char>(n[p])))++p;}
        if(p<n.size()&&n[p]=='.'){++p;size_t a=p;while(p<n.size()&&std::isdigit(static_cast<unsigned char>(n[p])))++p;if(a==p)throw std::runtime_error("Invalid number");}
        if(p<n.size()&&(n[p]=='e'||n[p]=='E')){++p;if(p<n.size()&&(n[p]=='+'||n[p]=='-'))++p;size_t a=p;while(p<n.size()&&std::isdigit(static_cast<unsigned char>(n[p])))++p;if(a==p)throw std::runtime_error("Invalid number");}
        if(p!=n.size())throw std::runtime_error("Invalid number");return j;
    }
public:
    explicit JsonParser(const std::string& text):s(text){if(s.rfind("\xEF\xBB\xBF",0)==0)pos=3;}
    Json parse(){if(s.size()>1024*1024)throw std::runtime_error("JSON size limit");auto j=value(0);ws();if(pos!=s.size())throw std::runtime_error("Trailing JSON");return j;}
};
}
