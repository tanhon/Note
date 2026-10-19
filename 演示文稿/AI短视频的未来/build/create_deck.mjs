import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';
process.env.RUNTIME_NODE_MODULES=String.raw`C:\Users\yangyasheng\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`;

const ROOT=String.raw`D:\Notes\演示文稿\AI短视频的未来`;
const SKILL=String.raw`C:\Users\yangyasheng\.codex\plugins\cache\openai-primary-runtime\presentations\26.1015.12040\skills\presentations`;
const PY=String.raw`C:\Users\yangyasheng\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`;
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={ink:'#222A2D',muted:'#657174',paper:'#F5F3EE',amber:'#B46B28',gold:'#F4BF76',white:'#FFFFFF',light:'#D7DDD9',green:'#3B6257'};
const FONT='Microsoft YaHei';
const sources=[
 {id:'S1',name:'QuestMobile｜2026 短剧行业洞察报告',date:'2026-04-08',url:'https://www.questmobile.cn/research/report/2041710682848727041/',use:'用户规模、应用迁移与观看行为；报告口径不等于 AI 短剧总体。'},
 {id:'S2',name:'Cao 等｜Audience in the Loop',date:'2026',url:'https://arxiv.org/abs/2602.14045',use:'28 名微短剧编剧的访谈；反馈如何进入创作。'},
 {id:'S3',name:'科技日报／新华网｜AI 漫剧产业报道',date:'2026-03-20',url:'https://www.news.cn/tech/20260320/f6fa062b5353475bb52dfc1ca31e1ccd/c.html',use:'平台工具、扶持与产业链；行业报道，不是收益保证。'},
 {id:'S4',name:'光明日报／新华网｜AI 创作实践报道',date:'2026-08-18',url:'https://www.news.cn/ent/20260818/75f46c22efb84f35b8ef3db85917d7f2/c.html',use:'创作者实践与反复试错成本；个案不能外推全行业。'},
 {id:'S5',name:'YouTube｜获利政策澄清',date:'2025-07',url:'https://support.google.com/youtube/thread/356734251?hl=en&msgid=357300241',use:'原创内容与批量重复内容的区别；海外平台案例。'},
 {id:'S6',name:'Doshi & Hauser｜Generative AI enhances individual creativity…',date:'Science Advances, 2024',url:'https://doi.org/10.1126/sciadv.adn5290',alt:'https://arxiv.org/abs/2312.00506',use:'短篇故事实验：个体评价提高与作品间相似性同时出现。'},
 {id:'S7',name:'Nguyen 等｜Feeds, Feelings, and Focus',date:'Psychological Bulletin, 2025',url:'https://doi.org/10.1037/bul0000498',use:'71 项研究、98,299 名参与者；短视频使用与认知等指标的相关性。'},
 {id:'S8',name:'Google DeepMind｜Genie 3 技术展示',date:'2025-08-05',url:'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/',use:'交互式生成世界的技术探索；不代表成熟的实时个性化长剧情。'},
 {id:'S9',name:'TikTok｜AI 内容识别与偏好控制公告',date:'2025-11-19',url:'https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?from_seo_redirect=1&lang=en',use:'公告中的 AI 内容比例控制测试；不宣称所有用户现已可用。'}
];
const talks=[]; const tableOwners=[];
function text(s,content,x,y,w,h,size=28,color=C.ink,bold=false){
 const a=s.shapes.add({geometry:'textbox',name:content.slice(0,25),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=content;a.text.style={fontSize:size,typeface:FONT,color,bold,insets:0,autoFit:'none',wrap:'square',verticalAlignment:'top'};return a;
}
async function bg(s,file){const b=await fs.readFile(path.join(ROOT,'assets',file));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'AI 生成概念插画，不对应真实事件',fit:'cover',position:{left:0,top:0,width:1280,height:720}});}
async function slide(title,section,{image=null,subtitle='',source='',label='观点与分析'}={}){
 const s=p.slides.add();s.background.fill=C.paper;if(image)await bg(s,image);
 const dark=!!image;const color=dark?C.white:C.ink;
 text(s,section.toUpperCase(),70,35,950,30,16,dark?C.gold:C.amber,true);
 text(s,title,70,91,image?555:1140,image?180:125,image?49:44,color,true);
 if(subtitle)text(s,subtitle,70,image?277:185,image?500:1110,80,24,dark?C.light:C.muted);
 const n=p.slides.items.length;
 text(s,source||label,70,666,1055,26,14,dark?C.light:C.muted);
 text(s,String(n).padStart(2,'0'),1160,664,55,28,17,dark?C.light:C.muted);
 if(image)text(s,'AI 概念示意',1030,35,180,25,13,C.light);
 return s;
}
function note(s,title,seconds,script,ids=[]){const refs=ids.map(id=>sources.find(x=>x.id===id)).filter(Boolean);const all=`第 ${talks.length+1} 页｜${title}\n建议用时：${seconds} 秒\n\n${script}\n\n资料与边界：\n${refs.map(x=>`[${x.id}] ${x.name}（${x.date}）\n${x.url}${x.alt?'\n作者版本：'+x.alt:''}\n使用范围：${x.use}`).join('\n\n')||'本页为演讲者观察、分析、虚构例子或建议；不作为实证结论。'}\n\n资料核对截至 2026-10-19。`;
s.speakerNotes.text=all;talks.push({title,seconds,script,refs});}
function table(s,values,widths,{top=265,height=300,size=25}={}){
 const tb=s.tables.add({rows:values.length,columns:values[0].length,left:70,top,width:1140,height,columnWidths:widths,values});
 tb.styleOptions={headerRow:true,bandedRows:false};tb.borders.assign({style:'solid',fill:'#DADDD7',width:1});
 for(let r=0;r<values.length;r++){tb.rows[r].height=r===0?62:(height-62)/(values.length-1);for(let c=0;c<values[0].length;c++){
 const cell=tb.getCell(r,c);cell.fill=r===0?C.ink:(r%2===1?'#FFFFFF':'#ECEEE8');
 cell.text.style={fontSize:r===0?23:size,typeface:FONT,color:r===0?C.white:C.ink,bold:r===0,insets:{left:18,right:16,top:13,bottom:10},autoFit:'none'};
 }}tableOwners.push(p.slides.items.length);return tb;
}

// 01
{
const s=await slide('AI 短视频\n的未来','一个关于创作与观看的讨论',{image:'cover-concept.png',label:'观点演讲 · 约 18 分钟 · 资料截至 2026.10.19'});
text(s,'创新、注意力与创作机会',70,312,510,70,30,C.gold);
text(s,'当画面越来越容易生成，\n什么让一个故事值得被讲述？',70,453,520,120,31,C.white);
note(s,'AI 短视频的未来',40,'今天我想从 AI 短剧出发，讨论 AI 会怎样改变短视频，以及这种变化对普通创作者和观看者意味着什么。画面越来越容易生成，过去需要团队完成的表达，如今可能由更少的人尝试。但我更关心的是：当所有人都能做出看起来不错的画面，什么还能让作品不同？我的回答会涉及创新，也会涉及我们怎样分配注意力、怎样积累生活经验。这里有行业资料，也有我的判断；谈到未来时，我会把它作为一种有条件的可能性。');
}
// 02
{
const s=await slide('他们追的，\n只是 AI 画面吗？','01 / 从身边的观察开始',{image:'attention-concept.png',label:'个人观察，不代表总体用户变化'});
text(s,'“原本不常刷短视频的人，\n也开始不停地看 AI 短剧。”',70,305,530,130,32,C.white);
text(s,'进入故事的理由，\n可能比制作技术更重要。',70,500,500,90,27,C.gold);
note(s,'从身边的观察开始',60,'我的出发点是身边的一个现象。我自己对一些 AI 短剧没有太大兴趣，甚至觉得不如电影片段，但有些过去不太常刷短视频的人，却开始不断追着看。这只是我看到的现象，不能据此说整个社会都发生了同样的转变。不过它提出了一个很有意思的问题：他们喜欢的究竟是 AI，还是借助 AI 更容易出现的某种故事？对观众来说，制作技术可能不是最先被感知的部分。熟悉的题材、容易进入的情节，以及看完这一段就想知道下一段的期待，可能更接近真实的观看动机。');
}
// 03
{
const s=await slide('先分清：火的是哪一种内容？','01 / 口径与证据',{subtitle:'AI 短视频是更大范围；AI 短剧是其中以连续叙事为核心的一部分。',source:'行业口径参考 [S1] QuestMobile，2026；本页为概念区分'});
table(s,[['概念','这里的意思','不能直接等同于'],['AI 短视频','AI 参与生成或制作的短视频','所有内容都有完整剧情'],['AI 短剧／漫剧','连续故事；AI 参与程度不同','每个环节都由 AI 完成'],['播放量／用户／收益','三类不同的观察指标','看得多 = 喜欢久 = 能盈利']],[260,445,435],{height:313});
text(s,'短剧行业总量，也不能当成 AI 短剧的规模。',70,604,1130,43,27,C.amber,true);
note(s,'先分清概念与指标',55,'这里先避免一个常见混淆。AI 短视频包括很多类型，例如广告、知识表达和视觉片段；AI 短剧只是其中以叙事为主的一部分。漫剧还可能混合人工编剧、配音、剪辑与生成画面。因此，看到短剧行业的增长，不能直接把所有增长归到 AI 身上。同样，播放次数、真实观看人数、持续追更和创作者收入，也不能互相替代。一条内容被推荐，不等于观众长期喜欢它；有很多观看，也不等于作者获得稳定收入。后面讨论未来时，我们会始终保留这些区别。',['S1']);
}
// 04
{
const s=await slide('吸引力来自故事、入口和连续期待','01 / 为什么会一直看',{subtitle:'这是解释观看行为的分析框架，不是对每位观众的心理诊断。',source:'分析依据：[S1] 行业用户观察；[S2] 微短剧创作者访谈'});
const cols=[{x:70,n:'01',h:'容易进入',b:'熟悉的题材与冲突\n降低理解故事的成本'},{x:465,n:'02',h:'容易遇见',b:'推荐、推广与平台迁移\n让内容进入更多人视野'},{x:860,n:'03',h:'容易续看',b:'悬念、反转与连续更新\n维持“再看一段”的期待'}];
for(const a of cols){text(s,a.n,a.x,292,300,65,50,C.amber);text(s,a.h,a.x,385,330,50,32,C.ink,true);text(s,a.b,a.x,463,345,110,25,C.muted);}
note(s,'故事、入口与连续期待',65,'如果把吸引力拆开，我会看三个环节。首先是容易进入：熟悉的关系、冲突和情感，让人在很短的时间里就知道自己在看什么。其次是容易遇见：平台推荐、内容推广和已有应用之间的迁移，都可能把内容送到新观众面前。QuestMobile 的报告也提到关联应用之间的用户流动，所以增长不一定意味着从来不看短视频的人突然被转化。最后是容易续看：观众在意人物接下来会怎样，悬念和连续更新让一段内容自然连接到下一段。这些机制在 AI 出现前就存在，AI 让更多内容可以进入这个系统。',['S1','S2']);
}
// 05
{
const s=await slide('AI 改变的，是尝试与复制的成本','01 / 供给如何被放大',{subtitle:'制作效率提高，可以服务小众表达，也可以放大已经验证过的套路。',source:'[S2] 28 名微短剧编剧访谈；[S3] 产业报道。因果关系为本演讲分析。'});
table(s,[['环节','新的可能','伴随的压力'],['生产','更快做出样片和视觉版本','试错、返工与一致性仍需投入'],['分发','更多作品有机会试探受众','内容增加，竞争也更密集'],['反馈','评论与观看反馈进入创作','容易反复复制有效情节']],[200,470,470],{height:315});
text(s,'生成速度提高，并不会自动提高故事深度。',70,604,1130,43,27,C.green,true);
note(s,'尝试与复制的成本',60,'AI 的影响不仅是把一个镜头做快。它还让创作者可以尝试更多版本，也让成熟模板更容易被复制。研究者对二十八名微短剧编剧的访谈，显示观众反馈会进入内容创作过程。这提醒我们，同质化不能只归因于模型：当某种情节已经被证明容易得到反馈，创作者和平台都有继续采用它的动力。技术既可以支持过去难以拍摄的小众故事，也可以加快同一套内容的生产。最后走向哪一边，取决于创作目标、评价方式和分发机制。',['S2','S3']);
}
// 06
{
const s=await slide('未来不会只有一种结果','02 / 2026—2029 的观察窗口',{subtitle:'以下是条件性情景，不是确定的技术进度表；三种方向可能同时存在。',label:'未来设想｜依据当前能力与产业结构推演'});
table(s,[['可能方向','成立的关键条件','值得观察什么'],['小团队与小众题材增加','工具可用 + 稳定交付 + 找到受众','是否出现可持续的差异化作品'],['模板与版本数量暴增','生成便宜 + 分发奖励相似内容','重复率、观看疲劳与收益集中'],['互动与个性化叙事探索','一致性、时延、成本与授权解决','选择是否真正改变后续剧情']],[320,440,380],{height:332,size:24});
note(s,'三种可能并存的未来',65,'接下来我用三种情景来讨论未来几年，而不是预测哪一年必然发生什么。第一种是创作更开放：小团队能尝试过去承担不起的题材，小众观众也得到更合适的内容。第二种是模板更密集：同样的故事被做成更多版本，竞争加剧，创作者未必更好赚钱。第三种是互动叙事开始发展，观众对人物或情节的选择能影响故事。这三种情况并不互相排斥。我们可以用未来几年观察它们，但互动故事的成熟时间尤其不确定。判断发展方向，要看持续交付、内容差异和用户体验，不只看演示片段有多惊艳。');
}
// 07
{
const s=await slide('机会一：\n让小题材被看见','02 / 创作者的表达空间',{image:'observation-concept.png',source:'情景推演；产业背景见 [S3]、[S4]'});
text(s,'地方生活 · 专业知识\n个人经历 · 小众想象',70,305,510,115,32,C.white);
text(s,'最值得积累的资产：\n你熟悉的人、问题与细节。',70,495,510,95,28,C.gold);
note(s,'让小题材被看见',60,'先说我更期待的一种可能。过去，一个人也许有很好的故事，却没有能力把它变成影像。AI 可以帮助这种表达迈出第一步。机会未必都在做下一部爆款爽剧，也可能在地方生活、专业知识、个人经历或者特别小众的想象里。例如，一个懂计算机的人，可以把系统故障背后的人和选择拍成故事；熟悉一种地方生活的人，可以写出外人注意不到的习惯和关系。这些例子是设想。技术降低了部分制作门槛，但对受众的理解、对细节的把握和持续完成作品的能力，仍然需要积累。',['S3','S4']);
}
// 08
{
const s=await slide('机会二：从“为你推荐”到“与你共演”？','02 / 个性化的边界',{subtitle:'“推荐适合你的作品”和“实时生成属于你的剧情”，是不同层次的能力。',source:'[S8] Genie 3（2025）是技术探索示例，不代表成熟的个性化短剧产品。'});
table(s,[['层次','观众体验','状态与限制'],['推荐已有内容','从内容库找到更合适的作品','已有分发方式'],['制作不同版本','调整语言、风格或部分情节','可尝试；仍需质量与授权控制'],['实时持续互动','选择影响人物与后续世界','探索情景；一致性与成本待解决']],[280,430,430],{height:310,size:24});
text(s,'故事越“懂我”，也越需要选择权、隐私边界与清晰标识。',70,599,1140,50,26,C.amber,true);
note(s,'个性化与互动的边界',60,'个性化听起来像是一个词，实际上有不同层次。推荐系统先从已有作品中挑选内容；多版本制作则让同一故事适应不同语言或风格；再往后，才是观众参与并持续改变剧情。像 Genie 3 这样的技术展示，让我们看到了交互生成世界的探索，但它不能证明稳定、便宜、长时间运行的个人专属短剧已经成熟。越往后，角色一致性、剧情逻辑、实时响应、成本和内容授权就越重要。还有一个问题：如果故事越来越懂我的喜好，我能否知道它如何被生成，并决定什么时候退出、换一种内容？',['S8']);
}
// 09
{
const s=await slide('能做出视频，离稳定收入还有多远？','03 / 创作者的商业现实',{subtitle:'生产门槛下降之后，找到受众、建立信任和持续交付的重要性会上升。',source:'分析框架；成本与创作实践参考 [S3]、[S4]'});
text(s,'作品',70,310,250,75,50,C.green,true);text(s,'受众',465,310,250,75,50,C.green,true);text(s,'回报',860,310,250,75,50,C.green,true);
text(s,'完成可观看的内容\n具备稳定的质量',70,425,330,90,27,C.ink);
text(s,'被合适的人发现\n让人愿意再次回来',465,425,330,90,27,C.ink);
text(s,'形成明确的收入方式\n覆盖时间和实际支出',860,425,330,90,27,C.ink);
text(s,'这是三个都需要解决的问题。',70,589,1100,50,30,C.amber,true);
note(s,'从做出作品到稳定收入',55,'对普通创作者来说，表达机会增加是一件好事，但我们最好把三个问题分开。第一个是能否完成作品，第二个是能否找到愿意持续观看的受众，第三个才是能否形成收入。AI 主要改善其中一部分生产过程。它并不保证作品会被推荐，也不保证平台分成、商业合作或者用户付费能够覆盖投入。更便宜的生产，有时还意味着更多人进入市场，竞争变得激烈。因此，我不会把 AI 创作描述成一种轻松赚钱的方法。比较实际的判断标准，是能否以可承受的投入，持续做出特定观众愿意回来的内容。',['S3','S4']);
}
// 10
{
const s=await slide('创作者需要算一笔完整的账','03 / 收益与成本',{subtitle:'可留存收入 − 实际支出 − 自己时间的价值，才接近一项工作的真实回报。',label:'决策框架｜没有使用虚构收入数字；具体规则按合作与平台约定核对'});
table(s,[['收入可能来自','不能漏算的投入','先核对什么'],['平台分成／用户付费','工具、生成、配音、剪辑','结算条件与分账规则'],['品牌或客户定制','沟通、返工、交付、获客','修改次数与素材权利'],['IP 授权／系列经营','长期维护、角色一致性','授权范围与持续需求']],[340,420,380],{height:310,size:25});
text(s,'先做可承受的小实验，再判断是否值得持续投入。',70,602,1130,45,27,C.green,true);
note(s,'完整成本与小实验',55,'算账时，工具订阅和生成费用只是表面可见的一部分。写故事、筛选结果、调整角色、重新配音、剪辑和沟通，也会花时间。定制项目还可能因为修改次数和交付要求，产生原本没想到的成本。收入的规则也不同：平台分成、用户付费、品牌项目和 IP 授权，分别依赖不同的条件。我更赞成先做一个范围可控的实验，记录真实投入和反馈。比如先完成一个短篇，再看受众是否愿意回来，而不是一开始就根据某个爆款的播放量，推算自己未来的收入。');
}
// 11
{
const s=await slide('竞争还会发生在分发、权利与信任上','03 / 谁能留下长期价值',{subtitle:'工具变得普遍之后，原创资产、受众关系和可靠交付更难被一次生成复制。',source:'[S5] YouTube 2025 政策澄清；[S9] TikTok 2025 测试公告。仅作海外案例。'});
table(s,[['需要积累的东西','为什么影响持续发展'],['可持续触达的受众','一次被推荐，不等于长期被记住'],['清晰的内容权利与交付能力','角色、声音、素材与修改责任需要明确'],['可信的创作与观看体验','标识、原创性和用户选择影响信任']],[430,710],{height:300,size:26});
text(s,'平台奖励什么，创作者就更可能继续生产什么。',70,594,1140,50,27,C.amber,true);
note(s,'分发、权利与信任',55,'创作者还处在平台规则之中。YouTube 在二〇二五年的说明里，并没有把使用 AI 本身视为不能获利的理由，而是强调原创、有实质价值的内容，区分大量重复生产的内容。这只是一个海外案例，不能直接当作国内平台规则。TikTok 也曾公告测试让用户调整 AI 内容比例。它们说明，未来竞争可能包括观众是否愿意看、是否知道内容的生成方式，以及平台如何评价原创性。对创作者来说，理解受众、拥有清晰的内容权利和可靠的交付方式，会比仅仅掌握一个按钮更持久。',['S5','S9']);
}
// 12
{
const s=await slide('换了名字，\n故事还是同一套？','04 / 创新与同质化',{image:'cover-concept.png',label:'演讲者观点｜复仇、恋爱等题材本身没有问题'});
text(s,'相似的冲突\n相似的反转\n相似的情绪兑现',70,307,480,160,32,C.white);
text(s,'真正缺少的，可能是\n具体的人与有代价的选择。',70,515,520,95,28,C.gold);
note(s,'同质化究竟缺少什么',65,'这里回到我最在意的问题：画面可以很好看，但看多了，会发现人物只是换了名字，故事只是换了地方。复仇、恋爱这些题材本身没有问题，它们一直能承载深刻的作品。问题在于，如果人物只负责触发冲突和兑现情绪，故事就很难留下更具体的东西。一个人为什么这样选择，他会失去什么，他和别人之间有哪些无法简单解决的关系，这些问题常常比新的画面更有力量。同质化既与生成方式有关，也与输入素材、商业激励和创作者的选择有关。我们要追求的创新，未必是从未出现过的题材，也可以是熟悉题材中新的观察。');
}
// 13
{
const s=await slide('“AI 不能创新”这个判断，需要更谨慎','04 / 研究带来的修正',{subtitle:'一种更可靠的表述：AI 能帮助产生新点子，但创作过程仍需要明确的判断标准。',source:'[S6] Doshi & Hauser，Science Advances，2024；短篇故事写作实验。'});
table(s,[['实验观察','对创作的启发'],['AI 辅助可提高个体作品的评价','把 AI 用于拓展候选想法，有实际价值'],['AI 辅助作品之间也更相似','共同的建议来源，可能缩小整体差异']],[510,630],{top:270,height:250,size:27});
text(s,'边界：一个写作任务的结果，不能概括所有艺术与创新。',70,557,1140,50,25,C.muted);
text(s,'人的责任：提出问题，选择表达，并为作品承担责任。',70,610,1140,43,27,C.green,true);
note(s,'AI 创意能力与人的判断',65,'我理解把创新看成人的重要优势的直觉，但如果把它说成 AI 完全做不到，论证就容易过头。Doshi 和 Hauser 的短篇故事实验发现，AI 提供的想法可以提高个体作品的评价，同时，AI 辅助作品之间也更相似。这个结果只适用于特定任务，不能直接推广到所有艺术创作。它给我的启发是：可以让 AI 帮助发散，但我们仍要决定什么问题值得提出，哪一种表达真正贴近生活，以及自己为什么接受这个结果。人的价值不必建立在证明机器永远做不到某件事上，也可以建立在持续观察、选择和负责的过程里。',['S6']);
}
// 14
{
const s=await slide('注意力：值得担心，\n也需要准确表达','04 / 观看如何影响生活',{image:'attention-concept.png',source:'[S7] Nguyen 等，Psychological Bulletin，2025'});
text(s,'71 项研究\n98,299 名参与者',70,303,530,125,38,C.gold,true);
text(s,'更多短视频使用，与较差的\n注意力等认知指标存在关联。',70,461,530,100,27,C.white);
text(s,'相关性 ≠ 单向因果或永久损伤',70,594,540,40,23,C.light);
note(s,'注意力的研究与边界',70,'我担心短视频占据越来越多时间，会让人更难投入一件事情，也更容易忽略身边细节。研究可以帮助我们准确表达这个担心。二〇二五年的一项元分析汇总了七十一项研究、九万八千二百九十九名参与者，发现更多短视频使用与较差的注意力等认知指标存在关联。但这不能证明只要刷短视频就必然造成永久损伤，也不能排除本来就难以集中注意力的人更愿意频繁使用短视频。对我的观点来说，已经足够值得追问的是：一天有限的时间被怎样使用？在持续切换内容之后，我是否还保留了阅读、深入工作和认真观察的空间？',['S7']);
}
// 15
{
const s=await slide('灵感的边界，也可能是输入的边界','04 / 从注意力到创造力',{subtitle:'如果长期只接触相似模板，我们提出的问题与想象的答案，也可能逐渐相似。',label:'演讲者的条件性判断｜不是“刷短视频必然降低创造力”的研究结论'});
text(s,'反复接触同类内容',70,300,520,55,34,C.amber,true);
text(s,'熟悉同样的冲突与解决方式\n更容易沿着已有套路继续写',70,390,510,140,29,C.ink);
text(s,'接触不同的生活经验',675,300,535,55,34,C.green,true);
text(s,'读书、交谈、实践与独处\n让问题与细节进入创作',675,390,535,140,29,C.ink);
text(s,'关键不是媒介的长短，而是输入是否多样、理解是否深入。',70,591,1140,55,28,C.ink,true);
note(s,'输入与灵感的关系',65,'关于灵感，我想提出一个有条件的判断，而不是把它冒充成已经被直接证明的事实。如果一个人长期只接触相似的情节和情绪模式，他可调用的材料就可能越来越集中在这些模式里。短视频可以带来新知识和陌生经验，长内容也可能重复空洞，所以问题不能简单归结为长和短。更关键的是输入的多样性，以及我们有没有停下来理解和反思。读一本书、听朋友讲一件具体的事、认真完成一次工作，甚至注意到一个不起眼的动作，都可能给创作带来新材料。保留这些空间，是我认为值得主动做出的选择。');
}
// 16
{
const s=await slide('同一个“复仇”题材，也能问出不同问题','04 / 一个虚构的创作示例',{subtitle:'创新可以发生在人物的处境、细节和选择里。',label:'虚构示例｜用于说明创作思路，不对应现有作品'});
table(s,[['熟悉的模板','加入具体的人之后'],['受辱 → 变强 → 反击 → 获胜','主人公终于有了反击的机会'],['重点：反击是否足够痛快','却发现反击会伤害一个无辜的人'],['人物主要推动情绪兑现','他还要不要继续？愿意承担什么代价？']],[485,655],{height:305,size:27});
text(s,'画面负责呈现这一刻，创作需要决定为什么值得看。',70,601,1140,47,28,C.green,true);
note(s,'把模板变成具体的问题',65,'举一个很简单的虚构例子。一个人受到侮辱，后来获得力量，最后成功反击，这当然可以是一个成立的故事。但如果我们再问一步：他终于能够复仇，却发现行动会伤害一个无辜的人，那故事的重心就变化了。观众开始关心他怎么选择，而不仅仅关心反击有多痛快。继续往下，还可以加入他的工作、家庭、语言和习惯，让这种选择发生在一个具体的人身上。这个例子并不是说所有作品都必须沉重，而是想说明，故事深度来自问题被认真对待。AI 可以协助呈现，但创作者需要决定自己想把观众的注意力带向哪里。');
}
// 17
{
const s=await slide('给创作者的一个\n小规模实验','05 / 把观点变成行动',{image:'observation-concept.png',label:'实践建议｜用于检验表达，不保证传播或收入'});
text(s,'记录一个真实细节\n提出一个值得追问的问题\n让 AI 给出多个处理方式\n用自己的标准选出一个',70,303,545,220,29,C.white);
text(s,'再问观众：\n“你记住了什么？为什么？”',70,561,545,75,26,C.gold);
note(s,'一个可以开始的创作实验',65,'如果我准备尝试 AI 创作，会从一个很小的实验开始。先记录生活里真正注意到的细节，再提一个自己在意的问题。例如，一个人为什么在明明可以拒绝的时候仍然答应？然后让 AI 提供几种表达方式，看看它有没有打开我原本没想到的方向。选择的时候，要能说出自己为什么选它，而不是因为画面最华丽。最后，把作品给少量真实观众看，问他们记住了什么、哪里没有理解、是否愿意再看一篇。这样的反馈能帮助我们判断，作品有没有建立自己的表达，而不仅是复制一个容易获得点击的结构。');
}
// 18
{
const s=await slide('未来值得期待的，\n是更多值得讲的故事','05 / 我的判断',{image:'observation-concept.png',label:'演讲结语｜技术发展与个人选择可以同时被讨论'});
text(s,'AI 扩大表达的可能。\n观察、判断与责任，\n决定我们想表达什么。',70,305,535,165,33,C.white);
text(s,'你希望 AI 带来：\n更多相似的满足，还是更多新的理解？',70,529,555,100,25,C.gold);
note(s,'最后的判断与讨论',65,'最后，我并不想把 AI 短视频简单判断为好或坏。它可以让更多人参与创作，可以让小众故事拥有影像，也可能把成熟套路生产得更快，把注意力争夺得更细。对创作者来说，我更看重有价值的观察、清晰的问题和对作品负责的判断。对观看者来说，我希望保留主动选择的能力，让娱乐之外仍有阅读、实践、交谈和注意生活的时间。我的判断是：技术扩大了我们表达的可能，但它不会替我们决定什么值得表达。留给大家的问题是，我们希望这些工具主要带来更多相似的满足，还是也能带来更多新的理解？');
}
// 19
{
const s=await slide('资料附录 A｜产业、创作者与平台','附录 / 不计入正文演讲时间',{subtitle:'详细链接与适用范围收录在每页备注及配套演讲稿中。',label:'资料核对截至 2026-10-19｜报告、访谈与平台政策适用范围不同'});
const entries=[['S1','QuestMobile · 2026 短剧行业洞察报告','行业与应用口径；不能直接等同 AI 短剧总量'],['S2','Cao 等 · Audience in the Loop · 2026','28 名编剧访谈；解释反馈机制，不证明全民行为'],['S3 / S4','科技日报、光明日报／新华网 · 2026','产业与创作个案；成本、收益不可直接外推'],['S5 / S9','YouTube / TikTok · 2025 官方说明','海外平台规则与测试公告；不等同国内普遍规则']];
let y=278;for(const [id,name,bound] of entries){text(s,id,70,y,130,45,24,C.amber,true);text(s,name,230,y,970,42,25,C.ink,true);text(s,bound,230,y+43,970,38,22,C.muted);y+=91;}
note(s,'资料附录 A',0,'本页用于问答和资料回查。产业报告提供特定口径下的观察，创作者访谈帮助理解生产过程，平台公告说明具体平台当时的规则或测试。三类材料都不能单独证明 AI 短剧导致原本不看短视频的人普遍沉迷。',['S1','S2','S3','S4','S5','S9']);
}
// 20
{
const s=await slide('资料附录 B｜研究与未来设想的边界','附录 / 核查与延伸阅读',{subtitle:'结论的力度，应与证据能回答的问题相匹配。',label:'概念插画由 AI 生成；不作为真实产品、事件或研究结果的证据'});
table(s,[['来源','支持什么','不支持什么'],['S6 · 创意写作实验\nScience Advances · 2024','AI 辅助的收益与集体相似性\n可以同时出现','AI 完全不能创新\n或所有 AI 作品必然同质化'],['S7 · 短视频元分析\nPsychological Bulletin · 2025','使用与注意力等指标的关联','每位观看者都会受损\n或永久损伤的单向因果'],['S8 · Genie 3\nGoogle DeepMind · 2025','交互生成世界的技术探索','成熟的实时个人专属短剧\n已经普及或必然何时到来']],[325,410,405],{top:260,height:342,size:23});
note(s,'资料附录 B',0,'本页用于现场核对证据边界。创意研究和注意力研究都不能代替对具体作品、具体人和具体使用情境的判断。未来的互动短剧属于有条件的推演，技术展示本身不足以证明商业可行性。',['S6','S7','S8']);
}

await fs.mkdir(path.join(ROOT,'build','previews'),{recursive:true});
await fs.mkdir(path.join(ROOT,'output'),{recursive:true});
const draft=path.join(ROOT,'build','candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(draft);
console.log('PPTX_EXPORTED',p.slides.items.length);
for(let i=0;i<p.slides.items.length;i++){
const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});
await fs.writeFile(path.join(ROOT,'build','previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
console.log('RENDERED',i+1);
}
const duration=talks.reduce((a,b)=>a+b.seconds,0);
const md=`# AI 短视频的未来\n\n创新、注意力与创作机会\n\n- 正文 18 页，附录 2 页。建议演讲约 ${Math.round(duration/60)} 分钟，可按现场语速调整。\n- 以下文字也已写入 PowerPoint 每页的演讲者备注。\n- 资料核对截至 2026-10-19。个人观察、研究结论与条件性设想均作了区分。\n\n${talks.map((t,i)=>`## ${String(i+1).padStart(2,'0')}｜${t.title}\n\n${t.seconds?'建议用时：'+t.seconds+' 秒。':'附录，供问答使用。'}\n\n${t.script}\n\n${t.refs.length?'参考资料：'+t.refs.map(r=>`[${r.id} · ${r.name}](${r.url})`).join('；')+'。':'本页主要为个人观察、分析、虚构例子或建议。'}`).join('\n\n')}\n\n## 完整资料索引\n\n${sources.map(x=>`- **${x.id}｜${x.name}**（${x.date}）\n  - [原始资料](${x.url})${x.alt?'；[作者版本]('+x.alt+')':''}\n  - 适用范围：${x.use}`).join('\n')}\n\n## 可继续讨论的三个问题\n\n1. 如果画面越来越相似，你会根据什么判断一个作品有自己的表达？\n2. AI 让小众题材更容易制作后，分发方式要怎样变化，才能让它们被看见？\n3. 作为观看者，我们希望平台提供哪些选择，让娱乐与深入体验都保有空间？\n\n## 图片说明\n\n本演示的三张背景均为 AI 生成概念插画，不对应真实产品或事件；它们用于表达主题，不作为证据。文字与表格均可在 PowerPoint 中编辑。\n`;
await fs.writeFile(path.join(ROOT,'output','AI短视频的未来_演讲稿与资料.md'),md,'utf8');
await fs.writeFile(path.join(ROOT,'assets','图片来源.md'),'# 概念插画来源\n\n工具：内置 imagegen。三张图片均为本次演示生成，使用于幻灯片背景。\n\n- cover-concept.png：炭黑与琥珀色的电影感画面；右侧重复的竖屏幻想场景、笔记本与绿叶；左侧留白。\n- attention-concept.png：暗色空间中的多块竖屏，右侧一个观看者的剪影，左侧留白；隐喻注意力环境。\n- observation-concept.png：窗边笔记本、绿叶与温暖阳光，街道生活在远处，左侧留白；隐喻观察与灵感。\n\n以上为生成提示的中文概述。均为概念插画，不是新闻图片或产品截图。\n','utf8');
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools','artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:ROOT,candidatePath:draft,finalPath:path.join(ROOT,'output','AI短视频的未来.pptx'),pythonExecutable:PY,integrityValidatorPath:path.join(SKILL,'container_tools','inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools','inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],explicitTotalSlideCount:20,requiredNativeTableOwnerSlides:tableOwners,requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:path.join(ROOT,'build','validation.json')});
console.log('FINALIZED',duration,'seconds',tableOwners);
