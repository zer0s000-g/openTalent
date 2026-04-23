"use strict";(()=>{var e={};e.id=410,e.ids=[410],e.modules={30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},14300:e=>{e.exports=require("buffer")},9523:e=>{e.exports=require("dns")},57147:e=>{e.exports=require("fs")},41808:e=>{e.exports=require("net")},22037:e=>{e.exports=require("os")},71576:e=>{e.exports=require("string_decoder")},24404:e=>{e.exports=require("tls")},90398:(e,t,i)=>{i.r(t),i.d(t,{headerHooks:()=>K,originalPathname:()=>J,patchFetch:()=>q,requestAsyncStorage:()=>W,routeModule:()=>H,serverHooks:()=>j,staticGenerationAsyncStorage:()=>x,staticGenerationBailout:()=>Z});var n={};i.r(n),i.d(n,{POST:()=>D});var l=i(95419),a=i(69108),o=i(99678),r=i(78070),s=i(65256),m=i(36898);let p=Object.entries({"software programming":{aliases:["software programming","programming","software development","coding","developer","engineering"],skills:["Python","TypeScript","JavaScript","React","Node.js","GraphQL","Go","Java","SQL","System Design","PostgreSQL","Docker","Kubernetes","Terraform","AWS"]},leadership:{aliases:["leadership","leadership capability","leadership domain"],skills:["Leadership","Decision Making","Mentorship","Coaching","Executive Presence","Business Strategy","Stakeholder Management","Cross-Functional Collaboration"]},"data analysis":{aliases:["data analysis","analytics","data science","analysis"],skills:["Data Analysis","Python","SQL","Statistics","Machine Learning","Experimentation","Forecasting","MLOps"]},"customer operations":{aliases:["customer operations","customer success","customer support","customer domain"],skills:["Customer Onboarding","Renewals","Account Management","Relationship Building","Escalation Management","Communication","Business Operations","Program Management"]},communication:{aliases:["communication","stakeholder management","communication domain"],skills:["Communication","Stakeholder Management","Cross-Functional Collaboration","Negotiation","Customer Discovery","Relationship Building"]}}).map(([e,t])=>({domain:e,aliases:[...t.aliases],skills:[...t.skills]}));function c(e){return e.toLowerCase().replace(/[^a-z0-9\s./-]/g," ").replace(/\s+/g," ").trim()}function u(e,t){let i=c(e);return[...t].sort((e,t)=>t.length-e.length).find(e=>i.includes(c(e)))}var d=i(82233);let y=s.Ry({answer:s.Z_().min(1),followUps:s.IX(s.Z_().min(1)).max(3).default([])}),g=s.Ry({intent:s.Km(["top_employees_by_capability","employees_by_role_or_skill","top_skills_by_scope","location_talent_distribution","unsupported"]),domain:s.Z_().optional(),skillNames:s.IX(s.Z_()).max(8).optional(),department:s.Z_().optional(),city:s.Z_().optional(),roleTerm:s.Z_().optional(),limit:s.Rx().int().min(1).max(10).optional(),confidence:s.Km(["high","medium","low"]).optional()});function h(e){return e.toLowerCase().replace(/[^a-z0-9\s./-]/g," ").replace(/\s+/g," ").trim()}async function k({systemPrompt:e,userPrompt:t,schema:i}){let n=(0,d.U)();if(!n)return null;let l=new AbortController,a=setTimeout(()=>l.abort(),n.timeoutMs);try{let a=await fetch(`${n.baseUrl.replace(/\/$/,"")}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n.apiKey}`,...n.headers},body:JSON.stringify({model:n.model,temperature:.2,response_format:{type:"json_object"},..."openrouter"===n.provider?{plugins:[{id:"response-healing"}]}:{},messages:[{role:"system",content:e},{role:"user",content:t}]}),signal:l.signal});if(!a.ok)return null;let o=await a.json(),r=o?.choices?.[0]?.message?.content;if("string"!=typeof r)return null;let s=i.safeParse(JSON.parse(r));if(!s.success)return null;return s.data}catch{return null}finally{clearTimeout(a)}}async function f(e,t,i){if("unsupported"!==i.type&&i.skillNames?.length)return i;let n=await k({systemPrompt:"Return strict JSON for a grounded workforce intent. Never invent cities, departments, or skills outside the provided metadata.",userPrompt:`You convert a user workforce question into a strict supported intent for OpenTalent AirNav.
You may only use the supported intents and the known metadata below.
Return JSON only.

User request: ${e}
Local interpretation: ${i.type}
Known departments: ${t.departments.join(", ")}
Known cities: ${t.cities.join(", ")}
Known skills: ${t.skills.slice(0,40).join(", ")}
Known titles: ${t.titles.slice(0,30).join(", ")}

Allowed intents:
- top_employees_by_capability
- employees_by_role_or_skill
- top_skills_by_scope
- location_talent_distribution
- unsupported

Rules:
- Prefer top_employees_by_capability for "top" or "best" employee ranking questions.
- Prefer top_skills_by_scope when the user asks which skills are strongest in a department or city.
- Prefer location_talent_distribution when the user asks where a role or capability is concentrated.
- Only use departments, cities, skills, and titles that appear in the known metadata.`,schema:g});if(!n||"unsupported"===n.intent)return i;let l=(n.skillNames||[]).filter(e=>t.skills.some(t=>h(t)===h(e))).map(e=>t.skills.find(t=>h(t)===h(e))),a=n.department?.trim(),o=a?t.departments.find(e=>h(e)===h(a)):void 0,r=n.city?.trim(),s=r?t.cities.find(e=>h(e)===h(r)):void 0;return{type:n.intent,normalizedMessage:i.normalizedMessage,limit:n.limit||i.limit,domain:n.domain||i.domain,skillNames:l.length?l:i.skillNames,department:o||i.department,city:s||i.city,roleTerm:n.roleTerm||i.roleTerm,rawRoleTerm:n.roleTerm||i.rawRoleTerm,interpretationSource:"llm"}}async function S(e,t){let i=await k({systemPrompt:"Rewrite grounded workforce assistant answers into concise enterprise-ready language. Return JSON only.",userPrompt:`You are rewriting a grounded workforce assistant response for AirNav Indonesia.
Use only the provided facts. Do not invent entities, skills, rankings, or explanations.
Return strict JSON with keys: answer, followUps.

Intent: ${e.type}
User request: ${e.normalizedMessage}
Current grounded answer: ${t.answer}
Grounding: ${t.grounding.map(e=>`${e.type}:${e.label}${e.value?`=${e.value}`:""}`).join(", ")||"none"}
Results: ${t.results.map(e=>`${e.title} | ${e.subtitle} | ${e.meta||""}`).join(" || ")||"none"}
Suggested follow-ups: ${t.followUps.join(" | ")||"none"}`,schema:y});return i?{...t,answer:i.answer,followUps:(i.followUps||[]).length?i.followUps:t.followUps}:t}var N=i(86930);let w=null;function E(e){if("number"==typeof e)return e;if(e&&"object"==typeof e){if("function"==typeof e.toNumber)return e.toNumber();if("number"==typeof e.low)return e.low}return 0}async function _(e,t,i,n){return n(await e.run(t,i))}async function T(){if(w&&w.expiresAt>Date.now())return w.value;let e=(0,N.Gg)();try{let t=await _(e,`
        CALL {
          MATCH (s:Skill)
          RETURN collect(DISTINCT s.name) AS skills
        }
        CALL {
          MATCH (d:Department)
          RETURN collect(DISTINCT d.name) AS departments
        }
        CALL {
          MATCH (e:Employee)
          WHERE coalesce(e.title, '') <> ''
          RETURN collect(DISTINCT e.title) AS titles
        }
        CALL {
          MATCH (e:Employee)
          WHERE coalesce(e.location, '') <> ''
          RETURN collect(DISTINCT e.location) AS cities
        }
        RETURN {
          skills: skills,
          departments: departments,
          titles: titles,
          cities: cities
        } AS result
      `,{},e=>{let t=e.records[0]?.get("result")||{};return{skills:[...t.skills||[]].sort(),departments:[...t.departments||[]].sort(),titles:[...t.titles||[]].sort(),cities:[...t.cities||[]].sort()}});return w={value:t,expiresAt:Date.now()+3e5},t}finally{await e.close()}}async function b(e){let t=(0,N.Gg)();try{return await _(t,`
        MATCH (e:Employee)-[rel:HAS_SKILL]->(s:Skill)
        WHERE s.name IN $skillNames
          AND ($city = '' OR e.location = $city)
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        WITH e,
             collect(DISTINCT s.name) AS matchedSkills,
             count(DISTINCT s) AS matchedSkillCount,
             sum(
               CASE coalesce(rel.proficiencyLevel, '')
                 WHEN 'Expert' THEN 40
                 WHEN 'Advanced' THEN 30
                 WHEN 'Intermediate' THEN 20
                 WHEN 'Foundational' THEN 10
                 ELSE 0
               END + coalesce(rel.yearsOfExperience, 0)
             ) AS capabilityScore
        RETURN e, matchedSkills, matchedSkillCount, capabilityScore
        ORDER BY matchedSkillCount DESC, capabilityScore DESC, e.name ASC
        LIMIT toInteger($limit)
      `,{skillNames:e.skillNames,city:e.city||"",department:e.department||"",roleTerm:e.roleTerm||"",limit:e.limit},e=>e.records.map(e=>{let t=e.get("e");return{employee_id:t.properties.employee_id,name:t.properties.name,title:t.properties.title,department:t.properties.department,location:t.properties.location,matchedSkills:e.get("matchedSkills")||[],matchedSkillCount:E(e.get("matchedSkillCount")),score:Number(e.get("capabilityScore")||0)}}))}finally{await t.close()}}async function R(e){let t=(0,N.Gg)(),i=!!e.skillNames?.length;try{return await _(t,`
        MATCH (e:Employee)
        WHERE ($city = '' OR e.location = $city)
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        OPTIONAL MATCH (e)-[rel:HAS_SKILL]->(s:Skill)
        WITH e,
             collect(DISTINCT s.name) AS employeeSkills,
             collect(rel) AS rels
        WHERE ($hasSkillFilter = false OR any(skillName IN employeeSkills WHERE skillName IN $skillNames))
        WITH e,
             [skillName IN employeeSkills WHERE skillName IN $skillNames] AS matchedSkills,
             reduce(total = 0.0, rel IN rels |
               total +
               CASE coalesce(rel.proficiencyLevel, '')
                 WHEN 'Expert' THEN 40
                 WHEN 'Advanced' THEN 30
                 WHEN 'Intermediate' THEN 20
                 WHEN 'Foundational' THEN 10
                 ELSE 0
               END +
               coalesce(rel.yearsOfExperience, 0)
             ) AS capabilityScore
        RETURN e, matchedSkills, size(matchedSkills) AS matchedSkillCount, capabilityScore
        ORDER BY matchedSkillCount DESC, capabilityScore DESC, e.name ASC
        LIMIT toInteger($limit)
      `,{roleTerm:e.roleTerm||"",skillNames:e.skillNames||[],city:e.city||"",department:e.department||"",hasSkillFilter:i,limit:e.limit},e=>e.records.map(e=>{let t=e.get("e");return{employee_id:t.properties.employee_id,name:t.properties.name,title:t.properties.title,department:t.properties.department,location:t.properties.location,matchedSkills:e.get("matchedSkills")||[],matchedSkillCount:E(e.get("matchedSkillCount")),score:Number(e.get("capabilityScore")||0)}}))}finally{await t.close()}}async function A(e){let t=(0,N.Gg)();try{return await _(t,`
        MATCH (e:Employee)-[:HAS_SKILL]->(s:Skill)
        WHERE ($department = '' OR e.department = $department)
          AND ($city = '' OR e.location = $city)
        WITH s.name AS skillName, count(DISTINCT e) AS employeeCount, collect(DISTINCT e.department)[..3] AS topDepartments
        ORDER BY employeeCount DESC, skillName ASC
        RETURN skillName, employeeCount, topDepartments
        LIMIT toInteger($limit)
      `,{department:e.department||"",city:e.city||"",limit:e.limit},e=>e.records.map(e=>({skillName:e.get("skillName"),employeeCount:E(e.get("employeeCount")),topDepartments:e.get("topDepartments")||[]})))}finally{await t.close()}}async function I(e){let t=(0,N.Gg)(),i=!!e.skillNames?.length;try{return await _(t,`
        MATCH (e:Employee)
        WHERE coalesce(e.location, '') <> ''
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
        WITH e, collect(DISTINCT s.name) AS employeeSkills
        WHERE ($hasSkillFilter = false OR any(skillName IN employeeSkills WHERE skillName IN $skillNames))
        WITH e.location AS city,
             count(DISTINCT e) AS employeeCount,
             collect(DISTINCT e.title)[..3] AS topRoles,
             reduce(allSkills = [], skills IN collect(employeeSkills) | allSkills + skills) AS flattenedSkills
        WITH city, employeeCount, topRoles,
             [skill IN flattenedSkills WHERE skill IS NOT NULL][..3] AS topSkills
        ORDER BY employeeCount DESC, city ASC
        RETURN city, employeeCount, topRoles, topSkills
        LIMIT toInteger($limit)
      `,{roleTerm:e.roleTerm||"",skillNames:e.skillNames||[],department:e.department||"",hasSkillFilter:i,limit:e.limit},e=>e.records.map(e=>({city:e.get("city"),employeeCount:E(e.get("employeeCount")),topRoles:e.get("topRoles")||[],topSkills:e.get("topSkills")||[]})))}finally{await t.close()}}function O(e){return[{type:"intent",label:e.type},...e.domain?[{type:"domain",label:e.domain}]:[],...e.skillNames?.map(e=>({type:"skill",label:e}))||[],...e.department?[{type:"department",label:e.department}]:[],...e.city?[{type:"city",label:e.city}]:[],...e.rawRoleTerm?[{type:"role",label:e.rawRoleTerm}]:[]]}function C(e,t=[]){let i=[...e.actions,...t],n=i.filter((e,t)=>i.findIndex(t=>t.href===e.href&&t.label===e.label)===t);return{...e,actions:n.slice(0,4)}}async function $(e){let t=e.skillNames?.length?await b({skillNames:e.skillNames,city:e.city,department:e.department,roleTerm:e.roleTerm,limit:e.limit}):await R({roleTerm:e.roleTerm,city:e.city,department:e.department,limit:e.limit});return t.length?C({intent:e.type,confidence:e.skillNames?.length?"high":"medium",answer:`I found ${t.length} strong matches${e.city?` in ${e.city}`:""}${e.department?` within ${e.department}`:""}. The ranking is based on matched skills, proficiency, and years of experience currently mapped in OpenTalent AirNav.`,results:t.map(e=>({type:"employee",key:e.employee_id,title:e.name,subtitle:e.title||"Employee",meta:function(e){let t=[e.title,e.department,e.location].filter(Boolean);return e.matchedSkillCount>0&&t.push(`${e.matchedSkillCount} matched skills`),t.join(" • ")}(e),href:`/employee/${e.employee_id}`,score:Number(e.score.toFixed(1)),supportingMetrics:{matchedSkills:e.matchedSkills.join(", "),yearsWeightedScore:Number(e.score.toFixed(1))}})),followUps:[e.city?`Which skills are strongest in ${e.city}?`:"Which skills are most concentrated in Engineering?","Where are software engineers located?"],actions:[{label:"Open talent graph",href:"/graph"},...e.skillNames?.[0]?[{label:`View ${e.skillNames[0]} cluster`,href:`/skills?skill=${encodeURIComponent(e.skillNames[0])}`}]:[],...e.city?[{label:`Open ${e.city} footprint`,href:"/locations"}]:[]],grounding:O(e)}):{intent:e.type,confidence:"low",answer:"I could not find employees that match those filters in the current workforce graph. Try loosening the skill, role, department, or city constraint.",results:[],followUps:["Show me the strongest Python employees.","Where are software engineers located?"],actions:[{label:"Open skills intelligence",href:"/skills"},{label:"Open Indonesia footprint",href:"/locations"}],grounding:O(e)}}async function L(e){let t=await A({department:e.department,city:e.city,limit:Math.min(e.limit,6)});if(!t.length)return{intent:e.type,confidence:"low",answer:"I could not find skill concentration data for that scope. Try naming a mapped department like Engineering or a city like Jakarta.",results:[],followUps:["Which skills are most concentrated in Engineering?","Which skills are strongest in Jakarta?"],actions:[{label:"Open skills intelligence",href:"/skills"}],grounding:O(e)};let i=e.department||e.city||"the current workforce scope",n=t[0];return C({intent:e.type,confidence:"high",answer:`${n.skillName} is the strongest visible capability in ${i}, with ${n.employeeCount} employees currently mapped to it. I ranked the rest by grounded employee coverage in that scope.`,results:t.map(e=>({type:"skill",key:e.skillName,title:e.skillName,subtitle:"Skill coverage",meta:`${e.employeeCount} employees${e.topDepartments.length?` • ${e.topDepartments.join(", ")}`:""}`,href:`/skills?skill=${encodeURIComponent(e.skillName)}`,score:e.employeeCount,supportingMetrics:{employeeCount:e.employeeCount}})),followUps:[`Show me the top employees for ${n.skillName}.`,e.department?`Where is ${n.skillName} distributed across Indonesia?`:"Open the relevant skill cluster."],actions:[{label:"Open skills intelligence",href:"/skills"},...e.department?[{label:`Open ${e.department} graph`,href:`/graph?mode=department&department=${encodeURIComponent(e.department)}`}]:[],...e.city?[{label:"Open Indonesia footprint",href:"/locations"}]:[]],grounding:O(e)})}async function v(e){let t=await I({roleTerm:e.roleTerm,skillNames:e.skillNames,department:e.department,limit:Math.min(e.limit,6)});if(!t.length)return{intent:e.type,confidence:"low",answer:"I could not find any location distribution for that role, department, or capability combination.",results:[],followUps:["Where are software engineers located?","Where is Python talent concentrated?"],actions:[{label:"Open Indonesia footprint",href:"/locations"}],grounding:O(e)};let i=t[0],n=e.rawRoleTerm||e.domain||e.skillNames?.[0]||e.department||"the current workforce segment";return C({intent:e.type,confidence:"high",answer:`${i.city} is the strongest location signal for ${n}, with ${i.employeeCount} mapped employees in the current graph slice.`,results:t.map(e=>({type:"location",key:e.city,title:e.city,subtitle:"Talent footprint",meta:`${e.employeeCount} employees${e.topRoles.length?` • ${e.topRoles.join(", ")}`:""}`,href:"/locations",score:e.employeeCount,supportingMetrics:{employeeCount:e.employeeCount,topSkills:e.topSkills.join(", ")}})),followUps:[`Show me the strongest employees in ${i.city}.`,i.topSkills[0]?`Who are the top employees in ${i.topSkills[0]}?`:"Open the Indonesia footprint."],actions:[{label:"Open Indonesia footprint",href:"/locations"},...e.skillNames?.[0]?[{label:`View ${e.skillNames[0]} cluster`,href:`/skills?skill=${encodeURIComponent(e.skillNames[0])}`}]:[]],grounding:O(e)})}async function M(e){let t;let i=await T(),n=function(e,t){let i=c(e),n=function(e){let t=e.match(/\btop\s+(\d+)\b/i);if(t)return Math.min(Math.max(Number(t[1]),1),10);let i=e.match(/\b(\d+)\s+employees?\b/i);return i?Math.min(Math.max(Number(i[1]),1),10):5}(i),l=function(e){let t=e.trim().toLowerCase();for(let e of p)if(e.aliases.some(e=>t.includes(e)))return e;return null}(i),a=u(i,t.cities.length?t.cities:m.bL.map(e=>e.name)),o=u(i,t.departments),r=u(i,t.skills),{roleTerm:s,rawRoleTerm:d}=function(e,t){let i=u(e,t);if(i)return{roleTerm:i,rawRoleTerm:i};let n=c(e),l=["engineer","manager","analyst","designer","researcher","scientist","coordinator","partner","support","csm","ae","sdr","counsel"].find(e=>n.includes(e));return l?{roleTerm:l,rawRoleTerm:l}:{}}(i,t.titles),y=l?.skills?.length?l.skills.filter(e=>t.skills.includes(e)):r?[r]:void 0,g=/\b(top|best|strongest|highest)\b/.test(i),h=/\b(employee|employees|people|talent|who)\b/.test(i),k=/\bskills?\b/.test(i),f=/\bwhere|location|city|cities|footprint|distribution\b/.test(i);return(g||h)&&(y?.length||s)?{type:g||y?.length?"top_employees_by_capability":"employees_by_role_or_skill",normalizedMessage:i,limit:n,domain:l?.domain,skillNames:y,department:o,city:a,roleTerm:s,rawRoleTerm:d}:k&&(o||a)?{type:"top_skills_by_scope",normalizedMessage:i,limit:n,department:o,city:a}:f&&(s||y?.length||o)?{type:"location_talent_distribution",normalizedMessage:i,limit:n,domain:l?.domain,skillNames:y,department:o,city:a,roleTerm:s,rawRoleTerm:d}:(/\bfind|list|show\b/.test(i)||h)&&(s||y?.length)?{type:"employees_by_role_or_skill",normalizedMessage:i,limit:n,domain:l?.domain,skillNames:y,department:o,city:a,roleTerm:s,rawRoleTerm:d}:{type:"unsupported",normalizedMessage:i,limit:n,department:o,city:a,skillNames:y,roleTerm:s,rawRoleTerm:d}}(e.message,i),l=await f(e.message,i,n);switch(l.type){case"top_employees_by_capability":case"employees_by_role_or_skill":t=await $(l);break;case"top_skills_by_scope":t=await L(l);break;case"location_talent_distribution":t=await v(l);break;default:t={intent:l.type,confidence:"low",answer:"I can answer grounded workforce questions about top employees by skill or role, skill concentration in a department or city, and talent distribution across locations. Try naming a specific skill, role, department, or Indonesian city.",results:[],followUps:["Give me the top 5 employees in software programming domain.","Which skills are most concentrated in Engineering?","Where are software engineers located?"],actions:[{label:"Open talent graph",href:"/graph"},{label:"View skills intelligence",href:"/skills"}],grounding:O(l),warnings:["The request could not be grounded to a supported workforce query yet."]}}let a=await S(l,t);return"llm"===l.interpretationSource&&l.type!==n.type?{...a,warnings:[...a.warnings||[],"OpenRouter interpretation was used to clarify this request before grounding it against workforce data."]}:a}let U=s.Ry({role:s.Km(["user","assistant"]),content:s.Z_().trim().min(1)}),P=s.Ry({message:s.Z_().trim().min(2,"Please enter a more specific workforce question."),conversation:s.IX(U).max(8).optional()});async function D(e){try{let t=await e.json(),i=P.safeParse(t);if(!i.success)return r.Z.json({error:i.error.issues[0]?.message||"Invalid assistant request"},{status:400});let n=await M(i.data);return r.Z.json(n)}catch(e){return r.Z.json({error:e instanceof Error?e.message:"Failed to run workforce assistant"},{status:500})}}let H=new l.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/assistant/route",pathname:"/api/assistant",filename:"route",bundlePath:"app/api/assistant/route"},resolvedPagePath:"/Users/ahqmb-tn001/Desktop/OpenTalent/app/api/assistant/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:W,staticGenerationAsyncStorage:x,serverHooks:j,headerHooks:K,staticGenerationBailout:Z}=H,J="/api/assistant/route";function q(){return(0,o.patchFetch)({serverHooks:j,staticGenerationAsyncStorage:x})}},82233:(e,t,i)=>{i.d(t,{U:()=>o,i:()=>a});var n=i(65256);let l=n.Ry({NEO4J_URI:n.Z_().url().default("bolt://localhost:7687"),NEO4J_USERNAME:n.Z_().min(1).default("neo4j"),NEO4J_PASSWORD:n.Z_().min(1,"NEO4J_PASSWORD is required"),NEO4J_DATABASE:n.Z_().min(1).default("neo4j"),LLM_BASE_URL:n.Z_().url().optional(),LLM_API_KEY:n.Z_().min(1).optional(),LLM_MODEL:n.Z_().min(1).optional(),LLM_TIMEOUT_MS:n.oQ.number().int().positive().default(8e3),OPENROUTER_API_KEY:n.Z_().min(1).optional(),OPENROUTER_BASE_URL:n.Z_().url().default("https://openrouter.ai/api/v1"),OPENROUTER_MODEL:n.Z_().min(1).default("google/gemma-4-31b-it:free"),OPENROUTER_SITE_URL:n.Z_().url().optional(),OPENROUTER_APP_NAME:n.Z_().min(1).default("OpenTalent AirNav")});function a(e=process.env){let t=l.safeParse(e);if(!t.success){let e=t.error.issues.map(e=>`${e.path.join(".")}: ${e.message}`).join("; ");throw Error(`Invalid environment configuration: ${e}`)}return t.data}function o(e=process.env){let t=a(e);return t.OPENROUTER_API_KEY?{provider:"openrouter",baseUrl:t.OPENROUTER_BASE_URL,apiKey:t.OPENROUTER_API_KEY,model:t.OPENROUTER_MODEL,timeoutMs:t.LLM_TIMEOUT_MS,headers:{...t.OPENROUTER_SITE_URL?{"HTTP-Referer":t.OPENROUTER_SITE_URL}:{},...t.OPENROUTER_APP_NAME?{"X-Title":t.OPENROUTER_APP_NAME}:{}}}:t.LLM_BASE_URL&&t.LLM_API_KEY&&t.LLM_MODEL?{provider:"generic",baseUrl:t.LLM_BASE_URL,apiKey:t.LLM_API_KEY,model:t.LLM_MODEL,timeoutMs:t.LLM_TIMEOUT_MS}:null}},36898:(e,t,i)=>{i.d(t,{BL:()=>a,bL:()=>n});let n=[{name:"Jakarta",province:"DKI Jakarta",lat:-6.2088,lng:106.8456,weight:24},{name:"Surabaya",province:"East Java",lat:-7.2575,lng:112.7521,weight:18},{name:"Bandung",province:"West Java",lat:-6.9175,lng:107.6191,weight:14},{name:"Medan",province:"North Sumatra",lat:3.5952,lng:98.6722,weight:12},{name:"Makassar",province:"South Sulawesi",lat:-5.1477,lng:119.4327,weight:10},{name:"Semarang",province:"Central Java",lat:-6.9667,lng:110.4167,weight:8},{name:"Denpasar",province:"Bali",lat:-8.6705,lng:115.2126,weight:8},{name:"Yogyakarta",province:"Special Region of Yogyakarta",lat:-7.7971,lng:110.3708,weight:7},{name:"Balikpapan",province:"East Kalimantan",lat:-1.2379,lng:116.8529,weight:7},{name:"Palembang",province:"South Sumatra",lat:-2.9909,lng:104.7566,weight:7},{name:"Pekanbaru",province:"Riau",lat:.5071,lng:101.4478,weight:6},{name:"Pontianak",province:"West Kalimantan",lat:-.0263,lng:109.3425,weight:6},{name:"Banjarmasin",province:"South Kalimantan",lat:-3.3194,lng:114.5908,weight:6},{name:"Manado",province:"North Sulawesi",lat:1.4748,lng:124.8421,weight:5},{name:"Kupang",province:"East Nusa Tenggara",lat:-10.1772,lng:123.607,weight:4},{name:"Jayapura",province:"Papua",lat:-2.5337,lng:140.7181,weight:4}],l=new Map(n.map(e=>[e.name,e]));function a(e){return l.get(e)}},86930:(e,t,i)=>{i.d(t,{Gg:()=>o});var n=i(22555),l=i(82233);let a=null;function o(e){let t=(0,l.i)();return(function(){if(!a){let e=(0,l.i)();a=n.ZP.driver(e.NEO4J_URI,n.ZP.auth.basic(e.NEO4J_USERNAME,e.NEO4J_PASSWORD),{maxConnectionPoolSize:50,connectionAcquisitionTimeout:3e4})}return a})().session({database:t.NEO4J_DATABASE,...e})}}};var t=require("../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),n=t.X(0,[638,402],()=>i(90398));module.exports=n})();