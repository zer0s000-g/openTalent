"use strict";(()=>{var e={};e.id=55,e.ids=[55],e.modules={30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},14300:e=>{e.exports=require("buffer")},9523:e=>{e.exports=require("dns")},57147:e=>{e.exports=require("fs")},41808:e=>{e.exports=require("net")},22037:e=>{e.exports=require("os")},71576:e=>{e.exports=require("string_decoder")},24404:e=>{e.exports=require("tls")},87827:(e,t,n)=>{n.r(t),n.d(t,{headerHooks:()=>X,originalPathname:()=>z,patchFetch:()=>ee,requestAsyncStorage:()=>j,routeModule:()=>G,serverHooks:()=>Q,staticGenerationAsyncStorage:()=>J,staticGenerationBailout:()=>Z});var r,i,o,s,l={};n.r(l),n.d(l,{POST:()=>V});var a=n(95419),p=n(69108),c=n(99678);let u=/\r\n|[\n\r]/g;function m(e,t){let n=0,r=1;for(let i of e.body.matchAll(u)){if("number"==typeof i.index||function(e,t){if(!e)throw Error(null!=t?t:"Unexpected invariant triggered.")}(!1),i.index>=t)break;n=i.index+i[0].length,r+=1}return{line:r,column:t+1-n}}function d(e,t){let n=e.locationOffset.column-1,r="".padStart(n)+e.body,i=t.line-1,o=e.locationOffset.line-1,s=t.line+o,l=1===t.line?n:0,a=t.column+l,p=`${e.name}:${s}:${a}
`,c=r.split(/\r\n|[\n\r]/g),u=c[i];if(u.length>120){let e=Math.floor(a/80),t=[];for(let e=0;e<u.length;e+=80)t.push(u.slice(e,e+80));return p+T([[`${s} |`,t[0]],...t.slice(1,e+1).map(e=>["|",e]),["|","^".padStart(a%80)],["|",t[e+1]]])}return p+T([[`${s-1} |`,c[i-1]],[`${s} |`,u],["|","^".padStart(a)],[`${s+1} |`,c[i+1]]])}function T(e){let t=e.filter(([e,t])=>void 0!==t),n=Math.max(...t.map(([e])=>e.length));return t.map(([e,t])=>e.padStart(n)+(t?" "+t:"")).join("\n")}class E extends Error{constructor(e,...t){var n,r,i;let{nodes:o,source:s,positions:l,path:a,originalError:p,extensions:c}=function(e){let t=e[0];return null==t||"kind"in t||"length"in t?{nodes:t,source:e[1],positions:e[2],path:e[3],originalError:e[4],extensions:e[5]}:t}(t);super(e),this.name="GraphQLError",this.path=null!=a?a:void 0,this.originalError=null!=p?p:void 0,this.nodes=h(Array.isArray(o)?o:o?[o]:void 0);let u=h(null===(n=this.nodes)||void 0===n?void 0:n.map(e=>e.loc).filter(e=>null!=e));this.source=null!=s?s:null==u?void 0:null===(r=u[0])||void 0===r?void 0:r.source,this.positions=null!=l?l:null==u?void 0:u.map(e=>e.start),this.locations=l&&s?l.map(e=>m(s,e)):null==u?void 0:u.map(e=>m(e.source,e.start));let d=!function(e){return"object"==typeof e&&null!==e}(null==p?void 0:p.extensions)?void 0:null==p?void 0:p.extensions;this.extensions=null!==(i=null!=c?c:d)&&void 0!==i?i:Object.create(null),Object.defineProperties(this,{message:{writable:!0,enumerable:!0},name:{enumerable:!1},nodes:{enumerable:!1},source:{enumerable:!1},positions:{enumerable:!1},originalError:{enumerable:!1}}),null!=p&&p.stack?Object.defineProperty(this,"stack",{value:p.stack,writable:!0,configurable:!0}):Error.captureStackTrace?Error.captureStackTrace(this,E):Object.defineProperty(this,"stack",{value:Error().stack,writable:!0,configurable:!0})}get[Symbol.toStringTag](){return"GraphQLError"}toString(){let e=this.message;if(this.nodes){for(let n of this.nodes)if(n.loc){var t;e+="\n\n"+d((t=n.loc).source,m(t.source,t.start))}}else if(this.source&&this.locations)for(let t of this.locations)e+="\n\n"+d(this.source,t);return e}toJSON(){let e={message:this.message};return null!=this.locations&&(e.locations=this.locations),null!=this.path&&(e.path=this.path),null!=this.extensions&&Object.keys(this.extensions).length>0&&(e.extensions=this.extensions),e}}function h(e){return void 0===e||0===e.length?void 0:e}function N(e,t,n){return new E(`Syntax Error: ${n}`,{source:e,positions:[t]})}class A{constructor(e,t,n){this.start=e.start,this.end=t.end,this.startToken=e,this.endToken=t,this.source=n}get[Symbol.toStringTag](){return"Location"}toJSON(){return{start:this.start,end:this.end}}}class S{constructor(e,t,n,r,i,o){this.kind=e,this.start=t,this.end=n,this.line=r,this.column=i,this.value=o,this.prev=null,this.next=null}get[Symbol.toStringTag](){return"Token"}toJSON(){return{kind:this.kind,value:this.value,line:this.line,column:this.column}}}function I(e){return e>=48&&e<=57}function y(e){return e>=97&&e<=122||e>=65&&e<=90}function R(e){return y(e)||95===e}(function(e){e.QUERY="query",e.MUTATION="mutation",e.SUBSCRIPTION="subscription"})(r||(r={})),function(e){e.QUERY="QUERY",e.MUTATION="MUTATION",e.SUBSCRIPTION="SUBSCRIPTION",e.FIELD="FIELD",e.FRAGMENT_DEFINITION="FRAGMENT_DEFINITION",e.FRAGMENT_SPREAD="FRAGMENT_SPREAD",e.INLINE_FRAGMENT="INLINE_FRAGMENT",e.VARIABLE_DEFINITION="VARIABLE_DEFINITION",e.SCHEMA="SCHEMA",e.SCALAR="SCALAR",e.OBJECT="OBJECT",e.FIELD_DEFINITION="FIELD_DEFINITION",e.ARGUMENT_DEFINITION="ARGUMENT_DEFINITION",e.INTERFACE="INTERFACE",e.UNION="UNION",e.ENUM="ENUM",e.ENUM_VALUE="ENUM_VALUE",e.INPUT_OBJECT="INPUT_OBJECT",e.INPUT_FIELD_DEFINITION="INPUT_FIELD_DEFINITION"}(i||(i={})),function(e){e.NAME="Name",e.DOCUMENT="Document",e.OPERATION_DEFINITION="OperationDefinition",e.VARIABLE_DEFINITION="VariableDefinition",e.SELECTION_SET="SelectionSet",e.FIELD="Field",e.ARGUMENT="Argument",e.FRAGMENT_SPREAD="FragmentSpread",e.INLINE_FRAGMENT="InlineFragment",e.FRAGMENT_DEFINITION="FragmentDefinition",e.VARIABLE="Variable",e.INT="IntValue",e.FLOAT="FloatValue",e.STRING="StringValue",e.BOOLEAN="BooleanValue",e.NULL="NullValue",e.ENUM="EnumValue",e.LIST="ListValue",e.OBJECT="ObjectValue",e.OBJECT_FIELD="ObjectField",e.DIRECTIVE="Directive",e.NAMED_TYPE="NamedType",e.LIST_TYPE="ListType",e.NON_NULL_TYPE="NonNullType",e.SCHEMA_DEFINITION="SchemaDefinition",e.OPERATION_TYPE_DEFINITION="OperationTypeDefinition",e.SCALAR_TYPE_DEFINITION="ScalarTypeDefinition",e.OBJECT_TYPE_DEFINITION="ObjectTypeDefinition",e.FIELD_DEFINITION="FieldDefinition",e.INPUT_VALUE_DEFINITION="InputValueDefinition",e.INTERFACE_TYPE_DEFINITION="InterfaceTypeDefinition",e.UNION_TYPE_DEFINITION="UnionTypeDefinition",e.ENUM_TYPE_DEFINITION="EnumTypeDefinition",e.ENUM_VALUE_DEFINITION="EnumValueDefinition",e.INPUT_OBJECT_TYPE_DEFINITION="InputObjectTypeDefinition",e.DIRECTIVE_DEFINITION="DirectiveDefinition",e.SCHEMA_EXTENSION="SchemaExtension",e.SCALAR_TYPE_EXTENSION="ScalarTypeExtension",e.OBJECT_TYPE_EXTENSION="ObjectTypeExtension",e.INTERFACE_TYPE_EXTENSION="InterfaceTypeExtension",e.UNION_TYPE_EXTENSION="UnionTypeExtension",e.ENUM_TYPE_EXTENSION="EnumTypeExtension",e.INPUT_OBJECT_TYPE_EXTENSION="InputObjectTypeExtension",e.TYPE_COORDINATE="TypeCoordinate",e.MEMBER_COORDINATE="MemberCoordinate",e.ARGUMENT_COORDINATE="ArgumentCoordinate",e.DIRECTIVE_COORDINATE="DirectiveCoordinate",e.DIRECTIVE_ARGUMENT_COORDINATE="DirectiveArgumentCoordinate"}(o||(o={})),function(e){e.SOF="<SOF>",e.EOF="<EOF>",e.BANG="!",e.DOLLAR="$",e.AMP="&",e.PAREN_L="(",e.PAREN_R=")",e.DOT=".",e.SPREAD="...",e.COLON=":",e.EQUALS="=",e.AT="@",e.BRACKET_L="[",e.BRACKET_R="]",e.BRACE_L="{",e.PIPE="|",e.BRACE_R="}",e.NAME="Name",e.INT="Int",e.FLOAT="Float",e.STRING="String",e.BLOCK_STRING="BlockString",e.COMMENT="Comment"}(s||(s={}));class O{constructor(e){let t=new S(s.SOF,0,0,0,0);this.source=e,this.lastToken=t,this.token=t,this.line=1,this.lineStart=0}get[Symbol.toStringTag](){return"Lexer"}advance(){return this.lastToken=this.token,this.token=this.lookahead()}lookahead(){let e=this.token;if(e.kind!==s.EOF)do if(e.next)e=e.next;else{let t=function(e,t){let n=e.source.body,r=n.length,i=t;for(;i<r;){let t=n.charCodeAt(i);switch(t){case 65279:case 9:case 32:case 44:++i;continue;case 10:++i,++e.line,e.lineStart=i;continue;case 13:10===n.charCodeAt(i+1)?i+=2:++i,++e.line,e.lineStart=i;continue;case 35:return function(e,t){let n=e.source.body,r=n.length,i=t+1;for(;i<r;){let e=n.charCodeAt(i);if(10===e||13===e)break;if(C(e))++i;else if(_(n,i))i+=2;else break}return D(e,s.COMMENT,t,i,n.slice(t+1,i))}(e,i);case 33:return D(e,s.BANG,i,i+1);case 36:return D(e,s.DOLLAR,i,i+1);case 38:return D(e,s.AMP,i,i+1);case 40:return D(e,s.PAREN_L,i,i+1);case 41:return D(e,s.PAREN_R,i,i+1);case 46:if(46===n.charCodeAt(i+1)&&46===n.charCodeAt(i+2))return D(e,s.SPREAD,i,i+3);break;case 58:return D(e,s.COLON,i,i+1);case 61:return D(e,s.EQUALS,i,i+1);case 64:return D(e,s.AT,i,i+1);case 91:return D(e,s.BRACKET_L,i,i+1);case 93:return D(e,s.BRACKET_R,i,i+1);case 123:return D(e,s.BRACE_L,i,i+1);case 124:return D(e,s.PIPE,i,i+1);case 125:return D(e,s.BRACE_R,i,i+1);case 34:if(34===n.charCodeAt(i+1)&&34===n.charCodeAt(i+2))return function(e,t){let n=e.source.body,r=n.length,i=e.lineStart,o=t+3,l=o,a="",p=[];for(;o<r;){let r=n.charCodeAt(o);if(34===r&&34===n.charCodeAt(o+1)&&34===n.charCodeAt(o+2)){a+=n.slice(l,o),p.push(a);let r=D(e,s.BLOCK_STRING,t,o+3,(function(e){var t,n;let r=Number.MAX_SAFE_INTEGER,i=null,o=-1;for(let t=0;t<e.length;++t){let s=e[t],l=function(e){var t;let n=0;for(;n<e.length&&(9===(t=e.charCodeAt(n))||32===t);)++n;return n}(s);l!==s.length&&(i=null!==(n=i)&&void 0!==n?n:t,o=t,0!==t&&l<r&&(r=l))}return e.map((e,t)=>0===t?e:e.slice(r)).slice(null!==(t=i)&&void 0!==t?t:0,o+1)})(p).join("\n"));return e.line+=p.length-1,e.lineStart=i,r}if(92===r&&34===n.charCodeAt(o+1)&&34===n.charCodeAt(o+2)&&34===n.charCodeAt(o+3)){a+=n.slice(l,o),l=o+1,o+=4;continue}if(10===r||13===r){a+=n.slice(l,o),p.push(a),13===r&&10===n.charCodeAt(o+1)?o+=2:++o,a="",l=o,i=o;continue}if(C(r))++o;else if(_(n,o))o+=2;else throw N(e.source,o,`Invalid character within String: ${k(e,o)}.`)}throw N(e.source,o,"Unterminated string.")}(e,i);return function(e,t){let n=e.source.body,r=n.length,i=t+1,o=i,l="";for(;i<r;){let r=n.charCodeAt(i);if(34===r)return l+=n.slice(o,i),D(e,s.STRING,t,i+1,l);if(92===r){l+=n.slice(o,i);let t=117===n.charCodeAt(i+1)?123===n.charCodeAt(i+2)?function(e,t){let n=e.source.body,r=0,i=3;for(;i<12;){let e=n.charCodeAt(t+i++);if(125===e){if(i<5||!C(r))break;return{value:String.fromCodePoint(r),size:i}}if((r=r<<4|v(e))<0)break}throw N(e.source,t,`Invalid Unicode escape sequence: "${n.slice(t,t+i)}".`)}(e,i):function(e,t){let n=e.source.body,r=x(n,t+2);if(C(r))return{value:String.fromCodePoint(r),size:6};if(f(r)&&92===n.charCodeAt(t+6)&&117===n.charCodeAt(t+7)){let e=x(n,t+8);if(L(e))return{value:String.fromCodePoint(r,e),size:12}}throw N(e.source,t,`Invalid Unicode escape sequence: "${n.slice(t,t+6)}".`)}(e,i):function(e,t){let n=e.source.body;switch(n.charCodeAt(t+1)){case 34:return{value:'"',size:2};case 92:return{value:"\\",size:2};case 47:return{value:"/",size:2};case 98:return{value:"\b",size:2};case 102:return{value:"\f",size:2};case 110:return{value:"\n",size:2};case 114:return{value:"\r",size:2};case 116:return{value:"	",size:2}}throw N(e.source,t,`Invalid character escape sequence: "${n.slice(t,t+2)}".`)}(e,i);l+=t.value,i+=t.size,o=i;continue}if(10===r||13===r)break;if(C(r))++i;else if(_(n,i))i+=2;else throw N(e.source,i,`Invalid character within String: ${k(e,i)}.`)}throw N(e.source,i,"Unterminated string.")}(e,i)}if(I(t)||45===t)return function(e,t,n){let r=e.source.body,i=t,o=n,l=!1;if(45===o&&(o=r.charCodeAt(++i)),48===o){if(I(o=r.charCodeAt(++i)))throw N(e.source,i,`Invalid number, unexpected digit after 0: ${k(e,i)}.`)}else i=g(e,i,o),o=r.charCodeAt(i);if(46===o&&(l=!0,o=r.charCodeAt(++i),i=g(e,i,o),o=r.charCodeAt(i)),(69===o||101===o)&&(l=!0,(43===(o=r.charCodeAt(++i))||45===o)&&(o=r.charCodeAt(++i)),i=g(e,i,o),o=r.charCodeAt(i)),46===o||R(o))throw N(e.source,i,`Invalid number, expected digit but got: ${k(e,i)}.`);return D(e,l?s.FLOAT:s.INT,t,i,r.slice(t,i))}(e,i,t);if(R(t))return function(e,t){let n=e.source.body,r=n.length,i=t+1;for(;i<r;){var o;if(y(o=n.charCodeAt(i))||I(o)||95===o)++i;else break}return D(e,s.NAME,t,i,n.slice(t,i))}(e,i);throw N(e.source,i,39===t?"Unexpected single quote character ('), did you mean to use a double quote (\")?":C(t)||_(n,i)?`Unexpected character: ${k(e,i)}.`:`Invalid character: ${k(e,i)}.`)}return D(e,s.EOF,r,r)}(this,e.end);e.next=t,t.prev=e,e=t}while(e.kind===s.COMMENT);return e}}function C(e){return e>=0&&e<=55295||e>=57344&&e<=1114111}function _(e,t){return f(e.charCodeAt(t))&&L(e.charCodeAt(t+1))}function f(e){return e>=55296&&e<=56319}function L(e){return e>=56320&&e<=57343}function k(e,t){let n=e.source.body.codePointAt(t);if(void 0===n)return s.EOF;if(n>=32&&n<=126){let e=String.fromCodePoint(n);return'"'===e?"'\"'":`"${e}"`}return"U+"+n.toString(16).toUpperCase().padStart(4,"0")}function D(e,t,n,r,i){let o=e.line,s=1+n-e.lineStart;return new S(t,n,r,o,s,i)}function g(e,t,n){if(!I(n))throw N(e.source,t,`Invalid number, expected digit but got: ${k(e,t)}.`);let r=e.source.body,i=t+1;for(;I(r.charCodeAt(i));)++i;return i}function x(e,t){return v(e.charCodeAt(t))<<12|v(e.charCodeAt(t+1))<<8|v(e.charCodeAt(t+2))<<4|v(e.charCodeAt(t+3))}function v(e){return e>=48&&e<=57?e-48:e>=65&&e<=70?e-55:e>=97&&e<=102?e-87:-1}function H(e,t){if(!e)throw Error(t)}function U(e,t){switch(typeof e){case"string":return JSON.stringify(e);case"function":return e.name?`[function ${e.name}]`:"[function]";case"object":return function(e,t){if(null===e)return"null";if(t.includes(e))return"[Circular]";let n=[...t,e];if("function"==typeof e.toJSON){let t=e.toJSON();if(t!==e)return"string"==typeof t?t:U(t,n)}else if(Array.isArray(e))return function(e,t){if(0===e.length)return"[]";if(t.length>2)return"[Array]";let n=Math.min(10,e.length),r=e.length-n,i=[];for(let r=0;r<n;++r)i.push(U(e[r],t));return 1===r?i.push("... 1 more item"):r>1&&i.push(`... ${r} more items`),"["+i.join(", ")+"]"}(e,n);return function(e,t){let n=Object.entries(e);return 0===n.length?"{}":t.length>2?"["+function(e){let t=Object.prototype.toString.call(e).replace(/^\[object /,"").replace(/]$/,"");if("Object"===t&&"function"==typeof e.constructor){let t=e.constructor.name;if("string"==typeof t&&""!==t)return t}return t}(e)+"]":"{ "+n.map(([e,n])=>e+": "+U(n,t)).join(", ")+" }"}(e,n)}(e,t);default:return String(e)}}let M=globalThis.process?function(e,t){return e instanceof t}:function(e,t){if(e instanceof t)return!0;if("object"==typeof e&&null!==e){var n;let r=t.prototype[Symbol.toStringTag];if(r===(Symbol.toStringTag in e?e[Symbol.toStringTag]:null===(n=e.constructor)||void 0===n?void 0:n.name)){let t=U(e,[]);throw Error(`Cannot use ${r} "${t}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`)}}return!1};class P{constructor(e,t="GraphQL request",n={line:1,column:1}){"string"==typeof e||H(!1,`Body must be a string. Received: ${U(e,[])}.`),this.body=e,this.name=t,this.locationOffset=n,this.locationOffset.line>0||H(!1,"line in locationOffset is 1-indexed and must be positive."),this.locationOffset.column>0||H(!1,"column in locationOffset is 1-indexed and must be positive.")}get[Symbol.toStringTag](){return"Source"}}class b{constructor(e,t={}){let{lexer:n,...r}=t;if(n)this._lexer=n;else{let t=M(e,P)?e:new P(e);this._lexer=new O(t)}this._options=r,this._tokenCounter=0}get tokenCount(){return this._tokenCounter}parseName(){let e=this.expectToken(s.NAME);return this.node(e,{kind:o.NAME,value:e.value})}parseDocument(){return this.node(this._lexer.token,{kind:o.DOCUMENT,definitions:this.many(s.SOF,this.parseDefinition,s.EOF)})}parseDefinition(){if(this.peek(s.BRACE_L))return this.parseOperationDefinition();let e=this.peekDescription(),t=e?this._lexer.lookahead():this._lexer.token;if(e&&t.kind===s.BRACE_L)throw N(this._lexer.source,this._lexer.token.start,"Unexpected description, descriptions are not supported on shorthand queries.");if(t.kind===s.NAME){switch(t.value){case"schema":return this.parseSchemaDefinition();case"scalar":return this.parseScalarTypeDefinition();case"type":return this.parseObjectTypeDefinition();case"interface":return this.parseInterfaceTypeDefinition();case"union":return this.parseUnionTypeDefinition();case"enum":return this.parseEnumTypeDefinition();case"input":return this.parseInputObjectTypeDefinition();case"directive":return this.parseDirectiveDefinition()}switch(t.value){case"query":case"mutation":case"subscription":return this.parseOperationDefinition();case"fragment":return this.parseFragmentDefinition()}if(e)throw N(this._lexer.source,this._lexer.token.start,"Unexpected description, only GraphQL definitions support descriptions.");if("extend"===t.value)return this.parseTypeSystemExtension()}throw this.unexpected(t)}parseOperationDefinition(){let e;let t=this._lexer.token;if(this.peek(s.BRACE_L))return this.node(t,{kind:o.OPERATION_DEFINITION,operation:r.QUERY,description:void 0,name:void 0,variableDefinitions:[],directives:[],selectionSet:this.parseSelectionSet()});let n=this.parseDescription(),i=this.parseOperationType();return this.peek(s.NAME)&&(e=this.parseName()),this.node(t,{kind:o.OPERATION_DEFINITION,operation:i,description:n,name:e,variableDefinitions:this.parseVariableDefinitions(),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseOperationType(){let e=this.expectToken(s.NAME);switch(e.value){case"query":return r.QUERY;case"mutation":return r.MUTATION;case"subscription":return r.SUBSCRIPTION}throw this.unexpected(e)}parseVariableDefinitions(){return this.optionalMany(s.PAREN_L,this.parseVariableDefinition,s.PAREN_R)}parseVariableDefinition(){return this.node(this._lexer.token,{kind:o.VARIABLE_DEFINITION,description:this.parseDescription(),variable:this.parseVariable(),type:(this.expectToken(s.COLON),this.parseTypeReference()),defaultValue:this.expectOptionalToken(s.EQUALS)?this.parseConstValueLiteral():void 0,directives:this.parseConstDirectives()})}parseVariable(){let e=this._lexer.token;return this.expectToken(s.DOLLAR),this.node(e,{kind:o.VARIABLE,name:this.parseName()})}parseSelectionSet(){return this.node(this._lexer.token,{kind:o.SELECTION_SET,selections:this.many(s.BRACE_L,this.parseSelection,s.BRACE_R)})}parseSelection(){return this.peek(s.SPREAD)?this.parseFragment():this.parseField()}parseField(){let e,t;let n=this._lexer.token,r=this.parseName();return this.expectOptionalToken(s.COLON)?(e=r,t=this.parseName()):t=r,this.node(n,{kind:o.FIELD,alias:e,name:t,arguments:this.parseArguments(!1),directives:this.parseDirectives(!1),selectionSet:this.peek(s.BRACE_L)?this.parseSelectionSet():void 0})}parseArguments(e){let t=e?this.parseConstArgument:this.parseArgument;return this.optionalMany(s.PAREN_L,t,s.PAREN_R)}parseArgument(e=!1){let t=this._lexer.token,n=this.parseName();return this.expectToken(s.COLON),this.node(t,{kind:o.ARGUMENT,name:n,value:this.parseValueLiteral(e)})}parseConstArgument(){return this.parseArgument(!0)}parseFragment(){let e=this._lexer.token;this.expectToken(s.SPREAD);let t=this.expectOptionalKeyword("on");return!t&&this.peek(s.NAME)?this.node(e,{kind:o.FRAGMENT_SPREAD,name:this.parseFragmentName(),directives:this.parseDirectives(!1)}):this.node(e,{kind:o.INLINE_FRAGMENT,typeCondition:t?this.parseNamedType():void 0,directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentDefinition(){let e=this._lexer.token,t=this.parseDescription();return(this.expectKeyword("fragment"),!0===this._options.allowLegacyFragmentVariables)?this.node(e,{kind:o.FRAGMENT_DEFINITION,description:t,name:this.parseFragmentName(),variableDefinitions:this.parseVariableDefinitions(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()}):this.node(e,{kind:o.FRAGMENT_DEFINITION,description:t,name:this.parseFragmentName(),typeCondition:(this.expectKeyword("on"),this.parseNamedType()),directives:this.parseDirectives(!1),selectionSet:this.parseSelectionSet()})}parseFragmentName(){if("on"===this._lexer.token.value)throw this.unexpected();return this.parseName()}parseValueLiteral(e){let t=this._lexer.token;switch(t.kind){case s.BRACKET_L:return this.parseList(e);case s.BRACE_L:return this.parseObject(e);case s.INT:return this.advanceLexer(),this.node(t,{kind:o.INT,value:t.value});case s.FLOAT:return this.advanceLexer(),this.node(t,{kind:o.FLOAT,value:t.value});case s.STRING:case s.BLOCK_STRING:return this.parseStringLiteral();case s.NAME:switch(this.advanceLexer(),t.value){case"true":return this.node(t,{kind:o.BOOLEAN,value:!0});case"false":return this.node(t,{kind:o.BOOLEAN,value:!1});case"null":return this.node(t,{kind:o.NULL});default:return this.node(t,{kind:o.ENUM,value:t.value})}case s.DOLLAR:if(e){if(this.expectToken(s.DOLLAR),this._lexer.token.kind===s.NAME){let e=this._lexer.token.value;throw N(this._lexer.source,t.start,`Unexpected variable "$${e}" in constant value.`)}throw this.unexpected(t)}return this.parseVariable();default:throw this.unexpected()}}parseConstValueLiteral(){return this.parseValueLiteral(!0)}parseStringLiteral(){let e=this._lexer.token;return this.advanceLexer(),this.node(e,{kind:o.STRING,value:e.value,block:e.kind===s.BLOCK_STRING})}parseList(e){return this.node(this._lexer.token,{kind:o.LIST,values:this.any(s.BRACKET_L,()=>this.parseValueLiteral(e),s.BRACKET_R)})}parseObject(e){return this.node(this._lexer.token,{kind:o.OBJECT,fields:this.any(s.BRACE_L,()=>this.parseObjectField(e),s.BRACE_R)})}parseObjectField(e){let t=this._lexer.token,n=this.parseName();return this.expectToken(s.COLON),this.node(t,{kind:o.OBJECT_FIELD,name:n,value:this.parseValueLiteral(e)})}parseDirectives(e){let t=[];for(;this.peek(s.AT);)t.push(this.parseDirective(e));return t}parseConstDirectives(){return this.parseDirectives(!0)}parseDirective(e){let t=this._lexer.token;return this.expectToken(s.AT),this.node(t,{kind:o.DIRECTIVE,name:this.parseName(),arguments:this.parseArguments(e)})}parseTypeReference(){let e;let t=this._lexer.token;if(this.expectOptionalToken(s.BRACKET_L)){let n=this.parseTypeReference();this.expectToken(s.BRACKET_R),e=this.node(t,{kind:o.LIST_TYPE,type:n})}else e=this.parseNamedType();return this.expectOptionalToken(s.BANG)?this.node(t,{kind:o.NON_NULL_TYPE,type:e}):e}parseNamedType(){return this.node(this._lexer.token,{kind:o.NAMED_TYPE,name:this.parseName()})}peekDescription(){return this.peek(s.STRING)||this.peek(s.BLOCK_STRING)}parseDescription(){if(this.peekDescription())return this.parseStringLiteral()}parseSchemaDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("schema");let n=this.parseConstDirectives(),r=this.many(s.BRACE_L,this.parseOperationTypeDefinition,s.BRACE_R);return this.node(e,{kind:o.SCHEMA_DEFINITION,description:t,directives:n,operationTypes:r})}parseOperationTypeDefinition(){let e=this._lexer.token,t=this.parseOperationType();this.expectToken(s.COLON);let n=this.parseNamedType();return this.node(e,{kind:o.OPERATION_TYPE_DEFINITION,operation:t,type:n})}parseScalarTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("scalar");let n=this.parseName(),r=this.parseConstDirectives();return this.node(e,{kind:o.SCALAR_TYPE_DEFINITION,description:t,name:n,directives:r})}parseObjectTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("type");let n=this.parseName(),r=this.parseImplementsInterfaces(),i=this.parseConstDirectives(),s=this.parseFieldsDefinition();return this.node(e,{kind:o.OBJECT_TYPE_DEFINITION,description:t,name:n,interfaces:r,directives:i,fields:s})}parseImplementsInterfaces(){return this.expectOptionalKeyword("implements")?this.delimitedMany(s.AMP,this.parseNamedType):[]}parseFieldsDefinition(){return this.optionalMany(s.BRACE_L,this.parseFieldDefinition,s.BRACE_R)}parseFieldDefinition(){let e=this._lexer.token,t=this.parseDescription(),n=this.parseName(),r=this.parseArgumentDefs();this.expectToken(s.COLON);let i=this.parseTypeReference(),l=this.parseConstDirectives();return this.node(e,{kind:o.FIELD_DEFINITION,description:t,name:n,arguments:r,type:i,directives:l})}parseArgumentDefs(){return this.optionalMany(s.PAREN_L,this.parseInputValueDef,s.PAREN_R)}parseInputValueDef(){let e;let t=this._lexer.token,n=this.parseDescription(),r=this.parseName();this.expectToken(s.COLON);let i=this.parseTypeReference();this.expectOptionalToken(s.EQUALS)&&(e=this.parseConstValueLiteral());let l=this.parseConstDirectives();return this.node(t,{kind:o.INPUT_VALUE_DEFINITION,description:n,name:r,type:i,defaultValue:e,directives:l})}parseInterfaceTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("interface");let n=this.parseName(),r=this.parseImplementsInterfaces(),i=this.parseConstDirectives(),s=this.parseFieldsDefinition();return this.node(e,{kind:o.INTERFACE_TYPE_DEFINITION,description:t,name:n,interfaces:r,directives:i,fields:s})}parseUnionTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("union");let n=this.parseName(),r=this.parseConstDirectives(),i=this.parseUnionMemberTypes();return this.node(e,{kind:o.UNION_TYPE_DEFINITION,description:t,name:n,directives:r,types:i})}parseUnionMemberTypes(){return this.expectOptionalToken(s.EQUALS)?this.delimitedMany(s.PIPE,this.parseNamedType):[]}parseEnumTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("enum");let n=this.parseName(),r=this.parseConstDirectives(),i=this.parseEnumValuesDefinition();return this.node(e,{kind:o.ENUM_TYPE_DEFINITION,description:t,name:n,directives:r,values:i})}parseEnumValuesDefinition(){return this.optionalMany(s.BRACE_L,this.parseEnumValueDefinition,s.BRACE_R)}parseEnumValueDefinition(){let e=this._lexer.token,t=this.parseDescription(),n=this.parseEnumValueName(),r=this.parseConstDirectives();return this.node(e,{kind:o.ENUM_VALUE_DEFINITION,description:t,name:n,directives:r})}parseEnumValueName(){if("true"===this._lexer.token.value||"false"===this._lexer.token.value||"null"===this._lexer.token.value)throw N(this._lexer.source,this._lexer.token.start,`${w(this._lexer.token)} is reserved and cannot be used for an enum value.`);return this.parseName()}parseInputObjectTypeDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("input");let n=this.parseName(),r=this.parseConstDirectives(),i=this.parseInputFieldsDefinition();return this.node(e,{kind:o.INPUT_OBJECT_TYPE_DEFINITION,description:t,name:n,directives:r,fields:i})}parseInputFieldsDefinition(){return this.optionalMany(s.BRACE_L,this.parseInputValueDef,s.BRACE_R)}parseTypeSystemExtension(){let e=this._lexer.lookahead();if(e.kind===s.NAME)switch(e.value){case"schema":return this.parseSchemaExtension();case"scalar":return this.parseScalarTypeExtension();case"type":return this.parseObjectTypeExtension();case"interface":return this.parseInterfaceTypeExtension();case"union":return this.parseUnionTypeExtension();case"enum":return this.parseEnumTypeExtension();case"input":return this.parseInputObjectTypeExtension()}throw this.unexpected(e)}parseSchemaExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("schema");let t=this.parseConstDirectives(),n=this.optionalMany(s.BRACE_L,this.parseOperationTypeDefinition,s.BRACE_R);if(0===t.length&&0===n.length)throw this.unexpected();return this.node(e,{kind:o.SCHEMA_EXTENSION,directives:t,operationTypes:n})}parseScalarTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("scalar");let t=this.parseName(),n=this.parseConstDirectives();if(0===n.length)throw this.unexpected();return this.node(e,{kind:o.SCALAR_TYPE_EXTENSION,name:t,directives:n})}parseObjectTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("type");let t=this.parseName(),n=this.parseImplementsInterfaces(),r=this.parseConstDirectives(),i=this.parseFieldsDefinition();if(0===n.length&&0===r.length&&0===i.length)throw this.unexpected();return this.node(e,{kind:o.OBJECT_TYPE_EXTENSION,name:t,interfaces:n,directives:r,fields:i})}parseInterfaceTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("interface");let t=this.parseName(),n=this.parseImplementsInterfaces(),r=this.parseConstDirectives(),i=this.parseFieldsDefinition();if(0===n.length&&0===r.length&&0===i.length)throw this.unexpected();return this.node(e,{kind:o.INTERFACE_TYPE_EXTENSION,name:t,interfaces:n,directives:r,fields:i})}parseUnionTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("union");let t=this.parseName(),n=this.parseConstDirectives(),r=this.parseUnionMemberTypes();if(0===n.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:o.UNION_TYPE_EXTENSION,name:t,directives:n,types:r})}parseEnumTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("enum");let t=this.parseName(),n=this.parseConstDirectives(),r=this.parseEnumValuesDefinition();if(0===n.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:o.ENUM_TYPE_EXTENSION,name:t,directives:n,values:r})}parseInputObjectTypeExtension(){let e=this._lexer.token;this.expectKeyword("extend"),this.expectKeyword("input");let t=this.parseName(),n=this.parseConstDirectives(),r=this.parseInputFieldsDefinition();if(0===n.length&&0===r.length)throw this.unexpected();return this.node(e,{kind:o.INPUT_OBJECT_TYPE_EXTENSION,name:t,directives:n,fields:r})}parseDirectiveDefinition(){let e=this._lexer.token,t=this.parseDescription();this.expectKeyword("directive"),this.expectToken(s.AT);let n=this.parseName(),r=this.parseArgumentDefs(),i=this.expectOptionalKeyword("repeatable");this.expectKeyword("on");let l=this.parseDirectiveLocations();return this.node(e,{kind:o.DIRECTIVE_DEFINITION,description:t,name:n,arguments:r,repeatable:i,locations:l})}parseDirectiveLocations(){return this.delimitedMany(s.PIPE,this.parseDirectiveLocation)}parseDirectiveLocation(){let e=this._lexer.token,t=this.parseName();if(Object.prototype.hasOwnProperty.call(i,t.value))return t;throw this.unexpected(e)}parseSchemaCoordinate(){let e,t;let n=this._lexer.token,r=this.expectOptionalToken(s.AT),i=this.parseName();return(!r&&this.expectOptionalToken(s.DOT)&&(e=this.parseName()),(r||e)&&this.expectOptionalToken(s.PAREN_L)&&(t=this.parseName(),this.expectToken(s.COLON),this.expectToken(s.PAREN_R)),r)?t?this.node(n,{kind:o.DIRECTIVE_ARGUMENT_COORDINATE,name:i,argumentName:t}):this.node(n,{kind:o.DIRECTIVE_COORDINATE,name:i}):e?t?this.node(n,{kind:o.ARGUMENT_COORDINATE,name:i,fieldName:e,argumentName:t}):this.node(n,{kind:o.MEMBER_COORDINATE,name:i,memberName:e}):this.node(n,{kind:o.TYPE_COORDINATE,name:i})}node(e,t){return!0!==this._options.noLocation&&(t.loc=new A(e,this._lexer.lastToken,this._lexer.source)),t}peek(e){return this._lexer.token.kind===e}expectToken(e){let t=this._lexer.token;if(t.kind===e)return this.advanceLexer(),t;throw N(this._lexer.source,t.start,`Expected ${W(e)}, found ${w(t)}.`)}expectOptionalToken(e){return this._lexer.token.kind===e&&(this.advanceLexer(),!0)}expectKeyword(e){let t=this._lexer.token;if(t.kind===s.NAME&&t.value===e)this.advanceLexer();else throw N(this._lexer.source,t.start,`Expected "${e}", found ${w(t)}.`)}expectOptionalKeyword(e){let t=this._lexer.token;return t.kind===s.NAME&&t.value===e&&(this.advanceLexer(),!0)}unexpected(e){let t=null!=e?e:this._lexer.token;return N(this._lexer.source,t.start,`Unexpected ${w(t)}.`)}any(e,t,n){this.expectToken(e);let r=[];for(;!this.expectOptionalToken(n);)r.push(t.call(this));return r}optionalMany(e,t,n){if(this.expectOptionalToken(e)){let e=[];do e.push(t.call(this));while(!this.expectOptionalToken(n));return e}return[]}many(e,t,n){this.expectToken(e);let r=[];do r.push(t.call(this));while(!this.expectOptionalToken(n));return r}delimitedMany(e,t){this.expectOptionalToken(e);let n=[];do n.push(t.call(this));while(this.expectOptionalToken(e));return n}advanceLexer(){let{maxTokens:e}=this._options,t=this._lexer.advance();if(t.kind!==s.EOF&&(++this._tokenCounter,void 0!==e&&this._tokenCounter>e))throw N(this._lexer.source,t.start,`Document contains more that ${e} tokens. Parsing aborted.`)}}function w(e){let t=e.value;return W(e.kind)+(null!=t?` "${t}"`:"")}function W(e){return e===s.BANG||e===s.DOLLAR||e===s.AMP||e===s.PAREN_L||e===s.PAREN_R||e===s.DOT||e===s.SPREAD||e===s.COLON||e===s.EQUALS||e===s.AT||e===s.BRACKET_L||e===s.BRACKET_R||e===s.BRACE_L||e===s.PIPE||e===s.BRACE_R?`"${e}"`:e}var B=n(78070),F=n(86930),K=n(36898);function Y(e){if("number"==typeof e)return e;if(e&&"object"==typeof e){if("function"==typeof e.toNumber)return e.toNumber();if("number"==typeof e.low)return e.low}return 0}function $(e){return e?{id:e.elementId,labels:Array.isArray(e.labels)?e.labels:[],properties:e.properties??{}}:null}let q={getDashboardStats:{cypher:`
      CALL {
        MATCH (e:Employee)
        RETURN count(e) AS employeeCount
      }
      CALL {
        MATCH (s:Skill)
        RETURN count(s) AS skillCount
      }
      CALL {
        MATCH (e:Employee)
        WHERE coalesce(e.department, '') <> ''
        WITH e.department AS department, count(*) AS count
        ORDER BY count DESC
        RETURN collect({ name: department, count: count }) AS departments
      }
      CALL {
        MATCH (e:Employee)
        WHERE coalesce(e.location, '') <> ''
        WITH e.location AS location, count(*) AS count
        ORDER BY count DESC
        RETURN collect({ name: location, count: count }) AS locations
      }
      CALL {
        MATCH (s:Skill)<-[:HAS_SKILL]-(e:Employee)
        WITH s.name AS skill, count(DISTINCT e) AS count
        ORDER BY count DESC
        RETURN collect({ name: skill, count: count }) AS topSkills
      }
      CALL {
        MATCH (manager:Employee)<-[:REPORTS_TO]-(report:Employee)
        WITH manager, count(report) AS reportCount
        RETURN count(manager) AS managerCount, avg(toFloat(reportCount)) AS avgSpanOfControl
      }
      CALL {
        MATCH (e:Employee)
        OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
        WITH e, count(s) AS skillCount
        RETURN avg(toFloat(skillCount)) AS avgSkillsPerEmployee
      }
      RETURN {
        employeesAggregate: { count: employeeCount },
        skillsAggregate: { count: skillCount }
        ,departments: departments
        ,locations: locations
        ,topSkills: topSkills
        ,managerCount: managerCount
        ,avgSpanOfControl: avgSpanOfControl
        ,avgSkillsPerEmployee: avgSkillsPerEmployee
      } AS result
    `,transform:e=>e.records[0]?.get("result")||{employeesAggregate:{count:0},skillsAggregate:{count:0}}},employees:{cypher:`
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[:REPORTS_TO]->(m:Employee)
      OPTIONAL MATCH (e)<-[:REPORTS_TO]-(directs:Employee)
      OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (e)-[:HOLDS_CERTIFICATION]->(c:Certification)
      OPTIONAL MATCH (e)-[:HAS_EDUCATION]->(ed:Education)
      OPTIONAL MATCH (e)-[:ASPIRES_TO]->(a:Aspiration)
      RETURN e,
             collect(DISTINCT m)[0] AS manager,
             collect(DISTINCT directs) AS directReports,
             collect(DISTINCT s) AS skills,
             collect(DISTINCT c) AS certifications,
             collect(DISTINCT ed) AS education,
             collect(DISTINCT a) AS aspirations
    `,transform:e=>{let t=e.records[0];if(!t)return[];let n=t.get("e"),r=t.get("manager"),i=t.get("directReports")||[],o=t.get("skills")||[],s=t.get("certifications")||[],l=t.get("education")||[],a=t.get("aspirations")||[];return[{employee_id:n.properties.employee_id,name:n.properties.name,email:n.properties.email,title:n.properties.title,department:n.properties.department,location:n.properties.location,hired_date:n.properties.hired_date?.toString(),manager:r?{employee_id:r.properties.employee_id,name:r.properties.name,title:r.properties.title}:void 0,directReports:i.map(e=>({employee_id:e.properties.employee_id,name:e.properties.name,title:e.properties.title})),skills:o.map(e=>({name:e.properties.name})),certifications:s.map(e=>({name:e.properties.name,issuer:e.properties.issuer})),education:l.map(e=>({institution:e.properties.institution,degree:e.properties.degree,field:e.properties.field,year:e.properties.year})),aspirations:a.map(e=>({type:e.properties.type,targetRole:e.properties.targetRole,targetDepartment:e.properties.targetDepartment,timeline:e.properties.timeline}))}]}},searchEmployees:{cypher:`
      MATCH (e:Employee)
      WHERE toLower(coalesce(e.name, '')) CONTAINS toLower($query)
         OR toLower(coalesce(e.title, '')) CONTAINS toLower($query)
         OR toLower(coalesce(e.department, '')) CONTAINS toLower($query)
      RETURN e
      LIMIT toInteger($limit)
    `,transform:e=>e.records.map(e=>{let t=e.get("e");return{employee_id:t.properties.employee_id,name:t.properties.name,title:t.properties.title,department:t.properties.department,email:t.properties.email}})},skills:{cypher:`
      MATCH (s:Skill)
      OPTIONAL MATCH (e:Employee)-[:HAS_SKILL]->(s)
      WITH s, collect(DISTINCT e)[..200] AS employees
      RETURN s, employees, size(employees) AS employeeCount
      ORDER BY employeeCount DESC
    `,transform:e=>e.records.map(e=>({name:e.get("s").properties.name,employeeCount:Y(e.get("employeeCount")),employees:(e.get("employees")||[]).map(e=>({employee_id:e.properties.employee_id}))}))},getEmployeesBySkill:{cypher:`
      MATCH (e:Employee)-[:HAS_SKILL]->(s:Skill { name: $skillName })
      WITH e
      ORDER BY e.name ASC
      RETURN e
      LIMIT 50
    `,transform:e=>e.records.map(e=>{let t=e.get("e");return{employee_id:t.properties.employee_id,name:t.properties.name,title:t.properties.title,department:t.properties.department}})},getLocationRoleOptions:{cypher:`
      MATCH (e:Employee)
      WHERE coalesce(e.title, '') <> ''
      WITH e.title AS title, count(*) AS count
      ORDER BY count DESC, title ASC
      RETURN collect({ name: title, count: count })[..24] AS result
    `,transform:e=>(e.records[0]?.get("result")||[]).map(e=>({name:e.name,count:Y(e.count)}))},getIndonesiaLocationFootprint:{cypher:`
      MATCH (e:Employee)
      WHERE coalesce(e.location, '') <> ''
        AND ($department IS NULL OR $department = '' OR e.department = $department)
        AND ($roleTitle IS NULL OR $roleTitle = '' OR e.title = $roleTitle)
        AND (
          $skillName IS NULL OR $skillName = '' OR EXISTS {
            MATCH (e)-[:HAS_SKILL]->(:Skill { name: $skillName })
          }
        )
      WITH e.location AS city, collect(DISTINCT e) AS employees
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.department AS department, count(*) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..3] AS departments
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.title AS roleTitle, count(*) AS count
        WHERE roleTitle IS NOT NULL AND trim(roleTitle) <> ''
        WITH roleTitle, count
        ORDER BY count DESC, roleTitle ASC
        RETURN collect({ name: roleTitle, count: count })[..3] AS roles
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
        WITH skill.name AS skillName, count(DISTINCT employee) AS count
        WITH skillName, count
        ORDER BY count DESC, skillName ASC
        RETURN collect({ name: skillName, count: count })[..3] AS topSkills
      }
      RETURN collect({
        city: city,
        employeeCount: size(employees),
        departments: departments,
        roles: roles,
        topSkills: topSkills
      }) AS result
    `,transform:e=>(e.records[0]?.get("result")||[]).map(e=>{let t=(0,K.BL)(e.city);return t?{city:t.name,province:t.province,lat:t.lat,lng:t.lng,employeeCount:Y(e.employeeCount),departments:(e.departments||[]).map(e=>({name:e.name,count:Y(e.count)})),roles:(e.roles||[]).map(e=>({name:e.name,count:Y(e.count)})),topSkills:(e.topSkills||[]).map(e=>({name:e.name,count:Y(e.count)}))}:null}).filter(Boolean).sort((e,t)=>t.employeeCount-e.employeeCount||e.city.localeCompare(t.city))},getLocationDetail:{cypher:`
      MATCH (e:Employee)
      WHERE e.location = $cityName
        AND ($department IS NULL OR $department = '' OR e.department = $department)
        AND ($roleTitle IS NULL OR $roleTitle = '' OR e.title = $roleTitle)
        AND (
          $skillName IS NULL OR $skillName = '' OR EXISTS {
            MATCH (e)-[:HAS_SKILL]->(:Skill { name: $skillName })
          }
        )
      WITH collect(DISTINCT e) AS employees
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.department AS department, count(*) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..6] AS departments
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.title AS roleTitle, count(*) AS count
        WHERE roleTitle IS NOT NULL AND trim(roleTitle) <> ''
        WITH roleTitle, count
        ORDER BY count DESC, roleTitle ASC
        RETURN collect({ name: roleTitle, count: count })[..6] AS roles
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
        WITH skill.name AS skillName, count(DISTINCT employee) AS count
        WITH skillName, count
        ORDER BY count DESC, skillName ASC
        RETURN collect({ name: skillName, count: count })[..8] AS topSkills
      }
      RETURN {
        employees: [employee IN employees | {
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          location: employee.location
        }][..40],
        employeeCount: size(employees),
        departments: departments,
        roles: roles,
        topSkills: topSkills
      } AS result
    `,transform:(e,t)=>{let n="string"==typeof t?.cityName?t.cityName:"",r=n?(0,K.BL)(n):void 0,i=e.records[0]?.get("result");return i?{city:n,province:r?.province||"",lat:r?.lat??null,lng:r?.lng??null,employeeCount:Y(i.employeeCount),departments:(i.departments||[]).map(e=>({name:e.name,count:Y(e.count)})),roles:(i.roles||[]).map(e=>({name:e.name,count:Y(e.count)})),topSkills:(i.topSkills||[]).map(e=>({name:e.name,count:Y(e.count)})),employees:(i.employees||[]).map(e=>({employee_id:e.employee_id,name:e.name,title:e.title,department:e.department,location:e.location}))}:{city:n,province:r?.province||"",lat:r?.lat??null,lng:r?.lng??null,employeeCount:0,departments:[],roles:[],topSkills:[],employees:[]}}},unifiedSearch:{cypher:`
      WITH toLower(trim($query)) AS q
      CALL {
        WITH q
        MATCH (e:Employee)
        WHERE q <> ''
          AND (
            toLower(coalesce(e.employee_id, '')) CONTAINS q
            OR toLower(coalesce(e.name, '')) CONTAINS q
            OR toLower(coalesce(e.title, '')) CONTAINS q
            OR toLower(coalesce(e.department, '')) CONTAINS q
          )
        WITH e, q,
          CASE
            WHEN toLower(coalesce(e.employee_id, '')) = q THEN 520
            WHEN toLower(coalesce(e.name, '')) = q THEN 500
            WHEN toLower(coalesce(e.employee_id, '')) STARTS WITH q THEN 470
            WHEN toLower(coalesce(e.name, '')) STARTS WITH q THEN 450
            WHEN toLower(coalesce(e.title, '')) STARTS WITH q THEN 330
            WHEN toLower(coalesce(e.department, '')) STARTS WITH q THEN 300
            ELSE 220
          END AS score
        ORDER BY score DESC, e.name ASC
        RETURN collect({
          type: 'employee',
          key: e.employee_id,
          title: e.name,
          subtitle: coalesce(e.title, 'Employee'),
          meta: coalesce(e.department, ''),
          employee_id: e.employee_id,
          score: score
        })[..6] AS employees
      }
      CALL {
        WITH q
        MATCH (s:Skill)
        OPTIONAL MATCH (holder:Employee)-[:HAS_SKILL]->(s)
        WITH s, q, count(DISTINCT holder) AS employeeCount
        WHERE q <> '' AND toLower(coalesce(s.name, '')) CONTAINS q
        WITH s, employeeCount, q,
          CASE
            WHEN toLower(coalesce(s.name, '')) = q THEN 440
            WHEN toLower(coalesce(s.name, '')) STARTS WITH q THEN 400
            ELSE 240
          END AS score
        ORDER BY score DESC, employeeCount DESC, s.name ASC
        RETURN collect({
          type: 'skill',
          key: s.name,
          title: s.name,
          subtitle: 'Skill',
          meta: toString(employeeCount) + ' employees',
          skillName: s.name,
          score: score
        })[..6] AS skills
      }
      CALL {
        WITH q
        MATCH (e:Employee)
        WHERE coalesce(e.department, '') <> ''
        WITH e.department AS department, count(*) AS employeeCount, q
        WHERE q <> '' AND toLower(department) CONTAINS q
        WITH department, employeeCount, q,
          CASE
            WHEN toLower(department) = q THEN 420
            WHEN toLower(department) STARTS WITH q THEN 380
            ELSE 230
          END AS score
        ORDER BY score DESC, employeeCount DESC, department ASC
        RETURN collect({
          type: 'department',
          key: department,
          title: department,
          subtitle: 'Department',
          meta: toString(employeeCount) + ' employees',
          department: department,
          score: score
        })[..6] AS departments
      }
      RETURN employees + skills + departments AS results
    `,transform:e=>(e.records[0]?.get("results")||[]).map(e=>({type:e.type,key:e.key,title:e.title,subtitle:e.subtitle,meta:e.meta,employee_id:e.employee_id,skillName:e.skillName,department:e.department,score:Y(e.score)})).sort((e,t)=>t.score-e.score||String(e.title).localeCompare(String(t.title)))},getEnterpriseGraphOverview:{cypher:`
      MATCH (employee:Employee)
      WITH collect(DISTINCT employee) AS employees
      CALL {
        MATCH (department:Department)
        RETURN collect(DISTINCT department) AS departments
      }
      CALL {
        WITH employees
        MATCH (manager:Employee)
        WHERE NOT (manager)-[:REPORTS_TO]->()
        AND manager IN employees
        RETURN manager
        ORDER BY manager.name ASC
        LIMIT 1
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees, departments
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:BELONGS_TO_DEPARTMENT]->(department:Department)
        WHERE department IN departments
        RETURN collect(DISTINCT { start: emp, end: department, type: 'BELONGS_TO_DEPARTMENT' }) AS departmentRels
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WITH skill, count(DISTINCT emp) AS holderCount
        WHERE holderCount >= 10
        WITH skill, holderCount
        ORDER BY holderCount DESC, skill.name ASC
        RETURN collect(skill)[..16] AS curatedSkills
      }
      CALL {
        WITH employees, curatedSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WHERE skill IN curatedSkills
        RETURN collect(DISTINCT { start: emp, end: skill, type: 'HAS_SKILL' }) AS skillRels
      }
      RETURN {
        center: manager,
        nodes: employees + departments + curatedSkills,
        relationships: reportRels + departmentRels + skillRels
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");return t?.nodes?{center:$(t.center),nodes:(t.nodes||[]).map($).filter(Boolean),relationships:(t.relationships||[]).filter(e=>e?.start&&e?.end).map(e=>({start:{id:e.start.elementId},end:{id:e.end.elementId},type:e.type}))}:{center:void 0,nodes:[],relationships:[]}}},getOrganizationOverview:{cypher:`
      MATCH (exec:Employee)
      WHERE NOT (exec)-[:REPORTS_TO]->()
      OPTIONAL MATCH (exec)<-[:REPORTS_TO]-(direct:Employee)
      OPTIONAL MATCH (exec)-[:HAS_SKILL]->(execSkill:Skill)
      WITH exec,
           collect(DISTINCT direct)[..15] AS directs,
           collect(DISTINCT execSkill)[..10] AS execSkills,
           size(collect(DISTINCT direct)) AS reportCount
      ORDER BY reportCount DESC
      LIMIT 1
      RETURN {
        center: exec,
        nodes: [exec] + directs + execSkills
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");if(!t?.center)return{center:void 0,nodes:[],relationships:[]};let n=t.center,r=(t.nodes||[]).filter(Boolean),i=[];for(let e of r)e.elementId!==n.elementId&&(e.labels?.includes("Employee")&&i.push({start:{id:e.elementId},end:{id:n.elementId},type:"REPORTS_TO"}),e.labels?.includes("Skill")&&i.push({start:{id:n.elementId},end:{id:e.elementId},type:"HAS_SKILL"}));return{center:$(n),nodes:r.map($).filter(Boolean),relationships:i}}},getEmployeeNetwork:{cypher:`
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[:REPORTS_TO]->(manager:Employee)
      OPTIONAL MATCH (direct:Employee)-[:REPORTS_TO]->(e)
      OPTIONAL MATCH (e)-[:HAS_SKILL]->(skill:Skill)
      OPTIONAL MATCH (peer:Employee)-[:REPORTS_TO]->(manager)
      WHERE manager IS NOT NULL AND peer <> e
      WITH e,
           manager,
           collect(DISTINCT direct)[..12] AS directs,
           collect(DISTINCT skill)[..12] AS skills,
           collect(DISTINCT peer)[..12] AS peers
      RETURN {
        center: e,
        manager: manager,
        directs: directs,
        skills: skills,
        peers: peers,
        nodes: [e] + directs + peers + (CASE WHEN manager IS NULL THEN [] ELSE [manager] END) + skills
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");if(!t?.center)return{center:void 0,nodes:[],relationships:[]};let n=t.center,r=t.manager,i=t.directs||[],o=t.skills||[],s=t.peers||[],l=(t.nodes||[]).filter(Boolean),a=[];for(let e of(r&&a.push({start:{id:n.elementId},end:{id:r.elementId},type:"REPORTS_TO"}),i))a.push({start:{id:e.elementId},end:{id:n.elementId},type:"REPORTS_TO"});for(let e of o)a.push({start:{id:n.elementId},end:{id:e.elementId},type:"HAS_SKILL"});for(let e of s)r&&a.push({start:{id:e.elementId},end:{id:r.elementId},type:"REPORTS_TO"});return{center:$(n),nodes:l.map($).filter(Boolean),relationships:a}}},getDepartmentSubgraph:{cypher:`
      MATCH (d:Department { name: $department })
      OPTIONAL MATCH (employee:Employee)-[:BELONGS_TO_DEPARTMENT]->(d)
      WITH d, collect(DISTINCT employee)[..100] AS employees
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WITH skill, count(DISTINCT emp) AS employeeCount
        WHERE skill IS NOT NULL
        WITH skill, employeeCount
        ORDER BY employeeCount DESC, skill.name ASC
        RETURN collect(skill)[..12] AS topSkills
      }
      CALL {
        WITH employees, topSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WHERE skill IN topSkills
        RETURN collect(DISTINCT { start: emp, end: skill, type: 'HAS_SKILL' }) AS skillRels
      }
      WITH d,
           employees,
           topSkills,
           reportRels,
           skillRels,
           [emp IN employees | { start: emp, end: d, type: 'BELONGS_TO_DEPARTMENT' }] AS departmentRels
      RETURN {
        center: d,
        nodes: [d] + employees + topSkills,
        relationships: departmentRels + reportRels + skillRels
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");return t?.center?{center:$(t.center),nodes:(t.nodes||[]).map($).filter(Boolean),relationships:(t.relationships||[]).filter(e=>e?.start&&e?.end).map(e=>({start:{id:e.start.elementId},end:{id:e.end.elementId},type:e.type}))}:{center:void 0,nodes:[],relationships:[]}}},getSkillSubgraph:{cypher:`
      MATCH (s:Skill { name: $skillName })
      MATCH (e:Employee)-[holder:HAS_SKILL]->(s)
      WITH s, e, holder
      ORDER BY coalesce(holder.yearsOfExperience, 0) DESC, e.name ASC
      WITH s, collect(DISTINCT e)[..80] AS employees
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees, s
        UNWIND employees AS emp
        MATCH (emp)-[:HAS_SKILL]->(related:Skill)
        WHERE related <> s
        WITH related, count(DISTINCT emp) AS employeeCount
        ORDER BY employeeCount DESC, related.name ASC
        RETURN collect(related)[..12] AS relatedSkills
      }
      CALL {
        WITH employees, relatedSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(related:Skill)
        WHERE related IN relatedSkills
        RETURN collect(DISTINCT { start: emp, end: related, type: 'HAS_SKILL' }) AS relatedSkillRels
      }
      WITH s,
           employees,
           reportRels,
           relatedSkills,
           relatedSkillRels,
           [emp IN employees | { start: emp, end: s, type: 'HAS_SKILL' }] AS skillRels
      RETURN {
        center: s,
        nodes: [s] + employees + relatedSkills,
        relationships: reportRels + skillRels + relatedSkillRels
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");return t?.center?{center:$(t.center),nodes:(t.nodes||[]).map($).filter(Boolean),relationships:(t.relationships||[]).filter(e=>e?.start&&e?.end).map(e=>({start:{id:e.start.elementId},end:{id:e.end.elementId},type:e.type}))}:{center:void 0,nodes:[],relationships:[]}}},getSkillInsight:{cypher:`
      MATCH (s:Skill { name: $skillName })
      CALL {
        WITH s
        MATCH (employee:Employee)-[rel:HAS_SKILL]->(s)
        RETURN count(DISTINCT employee) AS employeeCount
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[:HAS_SKILL]->(s)
        WITH employee.department AS department, count(DISTINCT employee) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..6] AS departments
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[rel:HAS_SKILL]->(s)
        WITH employee, rel
        ORDER BY coalesce(rel.yearsOfExperience, 0) DESC, employee.name ASC
        RETURN collect({
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          proficiencyLevel: rel.proficiencyLevel,
          yearsOfExperience: rel.yearsOfExperience
        })[..8] AS topEmployees
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[:HAS_SKILL]->(s)
        MATCH (employee)-[:HAS_SKILL]->(related:Skill)
        WHERE related <> s
        WITH related.name AS name, count(DISTINCT employee) AS count
        ORDER BY count DESC, name ASC
        RETURN collect({ name: name, count: count })[..8] AS relatedSkills
      }
      RETURN {
        name: s.name,
        category: s.category,
        employeeCount: employeeCount,
        departments: departments,
        topEmployees: topEmployees,
        relatedSkills: relatedSkills
      } AS result
    `,transform:e=>{let t=e.records[0]?.get("result");return t?{name:t.name,category:t.category,employeeCount:Y(t.employeeCount),departments:(t.departments||[]).map(e=>({name:e.name,count:Y(e.count)})),topEmployees:(t.topEmployees||[]).map(e=>({employee_id:e.employee_id,name:e.name,title:e.title,department:e.department,proficiencyLevel:e.proficiencyLevel,yearsOfExperience:"number"==typeof e.yearsOfExperience?e.yearsOfExperience:Number(e.yearsOfExperience??0)})),relatedSkills:(t.relatedSkills||[]).map(e=>({name:e.name,count:Y(e.count)}))}:{name:"",category:void 0,employeeCount:0,departments:[],topEmployees:[],relatedSkills:[]}}}};async function V(e){try{let t=await e.json(),n=t?.query,r=t?.variables??{},i=t?.operationName;if("string"!=typeof n||!n.trim())return B.Z.json({errors:[{message:"Missing GraphQL query"}]},{status:400});let s=function(e,t){let n=(function(e,t){let n=new b(e,void 0),r=n.parseDocument();return Object.defineProperty(r,"tokenCount",{enumerable:!1,value:n.tokenCount}),r})(e).definitions.filter(e=>e.kind===o.OPERATION_DEFINITION),r=t?n.find(e=>e.name?.value===t):n[0];if(!r)throw Error("No GraphQL operation found in request");let i=r.selectionSet.selections.find(e=>e.kind===o.FIELD);if(!i)throw Error("No root query field found in operation");return i.name.value}(n,i),l=q[s],a="getIndonesiaLocationFootprint"===s||"getLocationDetail"===s?{skillName:"",department:"",roleTitle:"",...r}:r;if(!l)return B.Z.json({errors:[{message:`Unsupported query field: ${s}`}]},{status:400});let p=(0,F.Gg)();try{let e=await p.run(l.cypher,a),t={[s]:l.transform(e,a)};return B.Z.json({data:t})}finally{await p.close()}}catch(e){return B.Z.json({errors:[{message:e instanceof Error?e.message:"Unknown GraphQL error"}]},{status:500})}}let G=new a.AppRouteRouteModule({definition:{kind:p.x.APP_ROUTE,page:"/api/graphql/route",pathname:"/api/graphql",filename:"route",bundlePath:"app/api/graphql/route"},resolvedPagePath:"/Users/ahqmb-tn001/Desktop/OpenTalent/app/api/graphql/route.ts",nextConfigOutput:"",userland:l}),{requestAsyncStorage:j,staticGenerationAsyncStorage:J,serverHooks:Q,headerHooks:X,staticGenerationBailout:Z}=G,z="/api/graphql/route";function ee(){return(0,c.patchFetch)({serverHooks:Q,staticGenerationAsyncStorage:J})}},82233:(e,t,n)=>{n.d(t,{U:()=>s,i:()=>o});var r=n(65256);let i=r.Ry({NEO4J_URI:r.Z_().url().default("bolt://localhost:7687"),NEO4J_USERNAME:r.Z_().min(1).default("neo4j"),NEO4J_PASSWORD:r.Z_().min(1,"NEO4J_PASSWORD is required"),NEO4J_DATABASE:r.Z_().min(1).default("neo4j"),LLM_BASE_URL:r.Z_().url().optional(),LLM_API_KEY:r.Z_().min(1).optional(),LLM_MODEL:r.Z_().min(1).optional(),LLM_TIMEOUT_MS:r.oQ.number().int().positive().default(8e3),OPENROUTER_API_KEY:r.Z_().min(1).optional(),OPENROUTER_BASE_URL:r.Z_().url().default("https://openrouter.ai/api/v1"),OPENROUTER_MODEL:r.Z_().min(1).default("google/gemma-4-31b-it:free"),OPENROUTER_SITE_URL:r.Z_().url().optional(),OPENROUTER_APP_NAME:r.Z_().min(1).default("OpenTalent AirNav")});function o(e=process.env){let t=i.safeParse(e);if(!t.success){let e=t.error.issues.map(e=>`${e.path.join(".")}: ${e.message}`).join("; ");throw Error(`Invalid environment configuration: ${e}`)}return t.data}function s(e=process.env){let t=o(e);return t.OPENROUTER_API_KEY?{provider:"openrouter",baseUrl:t.OPENROUTER_BASE_URL,apiKey:t.OPENROUTER_API_KEY,model:t.OPENROUTER_MODEL,timeoutMs:t.LLM_TIMEOUT_MS,headers:{...t.OPENROUTER_SITE_URL?{"HTTP-Referer":t.OPENROUTER_SITE_URL}:{},...t.OPENROUTER_APP_NAME?{"X-Title":t.OPENROUTER_APP_NAME}:{}}}:t.LLM_BASE_URL&&t.LLM_API_KEY&&t.LLM_MODEL?{provider:"generic",baseUrl:t.LLM_BASE_URL,apiKey:t.LLM_API_KEY,model:t.LLM_MODEL,timeoutMs:t.LLM_TIMEOUT_MS}:null}},36898:(e,t,n)=>{n.d(t,{BL:()=>o,bL:()=>r});let r=[{name:"Jakarta",province:"DKI Jakarta",lat:-6.2088,lng:106.8456,weight:24},{name:"Surabaya",province:"East Java",lat:-7.2575,lng:112.7521,weight:18},{name:"Bandung",province:"West Java",lat:-6.9175,lng:107.6191,weight:14},{name:"Medan",province:"North Sumatra",lat:3.5952,lng:98.6722,weight:12},{name:"Makassar",province:"South Sulawesi",lat:-5.1477,lng:119.4327,weight:10},{name:"Semarang",province:"Central Java",lat:-6.9667,lng:110.4167,weight:8},{name:"Denpasar",province:"Bali",lat:-8.6705,lng:115.2126,weight:8},{name:"Yogyakarta",province:"Special Region of Yogyakarta",lat:-7.7971,lng:110.3708,weight:7},{name:"Balikpapan",province:"East Kalimantan",lat:-1.2379,lng:116.8529,weight:7},{name:"Palembang",province:"South Sumatra",lat:-2.9909,lng:104.7566,weight:7},{name:"Pekanbaru",province:"Riau",lat:.5071,lng:101.4478,weight:6},{name:"Pontianak",province:"West Kalimantan",lat:-.0263,lng:109.3425,weight:6},{name:"Banjarmasin",province:"South Kalimantan",lat:-3.3194,lng:114.5908,weight:6},{name:"Manado",province:"North Sulawesi",lat:1.4748,lng:124.8421,weight:5},{name:"Kupang",province:"East Nusa Tenggara",lat:-10.1772,lng:123.607,weight:4},{name:"Jayapura",province:"Papua",lat:-2.5337,lng:140.7181,weight:4}],i=new Map(r.map(e=>[e.name,e]));function o(e){return i.get(e)}},86930:(e,t,n)=>{n.d(t,{Gg:()=>s});var r=n(22555),i=n(82233);let o=null;function s(e){let t=(0,i.i)();return(function(){if(!o){let e=(0,i.i)();o=r.ZP.driver(e.NEO4J_URI,r.ZP.auth.basic(e.NEO4J_USERNAME,e.NEO4J_PASSWORD),{maxConnectionPoolSize:50,connectionAcquisitionTimeout:3e4})}return o})().session({database:t.NEO4J_DATABASE,...e})}}};var t=require("../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[638,402],()=>n(87827));module.exports=r})();