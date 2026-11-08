// 美漫大世界 · 手机面板 v0.2.0（桌面＋App 形态）
// 一期三应用扩展为九应用：📋人物 🌍世界 ⚔️战斗 📈加点 🎒背包 📇联系人 📅事件 📜日志 ⚙️设置
// 架构不变＝第二作用域：DOM 注入顶层文档（根带 mm-scope），动作全走引擎 data-mm-a 委托，本体零引擎逻辑复制。
// 数据面：__mmPhone桥（读玩家状态/四维池/渲染变量管理/本卡）。手机自有动作一律 data-ph-a 前缀。
(function () {
  'use strict';
  const TAG = '[美漫·手机]';
  const topDoc = (window.parent && window.parent.document) ? window.parent.document : document;
  const topWin = window.parent || window;
  // 幂等重建（v0.1.1）：旧 FAB/root/style 一律移除后再创建——文档对象可能被整体替换，early-return 会留尸体
  try {
    const 旧根 = topDoc.getElementById('mmPhoneRoot'); if (旧根) 旧根.remove();
    const 旧钮 = topDoc.getElementById('mmPhoneFab'); if (旧钮) 旧钮.remove();
    const 旧样 = topDoc.getElementById('mmPhoneStyle'); if (旧样) 旧样.remove();
  } catch (_) { }

  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pip = v => { const n = Math.max(0, Math.min(5, Number(v) || 0)); return '▰'.repeat(n) + '▱'.repeat(5 - n); };

  // ---------- 样式 ----------
  const style = topDoc.createElement('style');
  style.id = 'mmPhoneStyle';
  style.textContent = [
    // ================= 设计系统 v2「斯塔克·暗面」（Marvel 黑底红 #E62429 品牌层＋Stark 琥珀 #d0b078 数据层＋发丝线＋微动效） =================
    // —— FAB 启动钮 ——
    '#mmPhoneFab{position:fixed;right:14px;bottom:86px;z-index:9998;width:44px;height:44px;border-radius:14px;',
    'background:rgba(14,15,20,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(230,98,98,.35);color:#e66d6d;font-size:19px;line-height:42px;text-align:center;',
    'cursor:pointer;user-select:none;box-shadow:0 6px 24px rgba(0,0,0,.5);font-family:"PingFang SC","Microsoft YaHei UI",sans-serif;transition:transform .15s ease,border-color .15s}',
    '#mmPhoneFab:hover{border-color:rgba(230,98,98,.6)}#mmPhoneFab:active{transform:scale(.94)}',
    // —— 机身（bezel）——
    '#mmPhoneRoot{position:fixed;right:16px;bottom:30px;z-index:9999;width:332px;max-width:calc(100vw - 20px);',
    'height:min(684px,calc(100vh - 130px));display:none;flex-direction:column;padding:7px;',
    'background:linear-gradient(160deg,#1b1d23,#06070b 30%,#06070b 70%,#14161c);border-radius:34px;',
    'box-shadow:0 30px 80px rgba(0,0,0,.72),0 2px 10px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.05);',
    'font-family:"PingFang SC","Microsoft YaHei UI","Microsoft YaHei","Segoe UI",system-ui,sans-serif;font-size:12.5px;line-height:1.7;color:#ecebe6}',
    '#mmPhoneRoot *{box-sizing:border-box}',
    // —— 灵动岛 ——
    '#mmPhIsland{position:absolute;top:5px;left:50%;transform:translateX(-50%);width:78px;height:19px;border-radius:10px;background:#000;z-index:12;pointer-events:none}',
    '#mmPhIsland:after{content:"";position:absolute;right:6px;top:5.5px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#2a3140,#05060a 70%)}',
    // —— 状态栏（拖拽手柄）——
    '#mmPhoneHead{display:flex;align-items:center;gap:8px;height:30px;flex:0 0 auto;padding:0 16px;cursor:move;user-select:none;position:relative;z-index:11}',
    '#mmPhoneHead .clk{font-size:11.5px;font-weight:600;color:#f0efe9;font-variant-numeric:tabular-nums;letter-spacing:.02em}',
    '#mmPhoneHead .st{margin-left:auto;display:flex;align-items:center;gap:5px;color:#f0efe9}',
    '#mmPhoneHead .st svg{display:block}',
    '#mmPhoneHead .btp{font-size:10px;color:#f0efe9;font-variant-numeric:tabular-nums}',
    '#mmPhoneHead .ph-x{cursor:pointer;color:rgba(240,239,233,.45);padding:0 2px 0 7px;font-size:12px;transition:color .15s}#mmPhoneHead .ph-x:hover{color:#e08a8a}',
    // —— 共享 App 导航栏（标题下红色短标尺＝漫威棱角母题）——
    '#mmPhAppbar{display:none;align-items:center;height:42px;flex:0 0 auto;padding:0 6px;position:relative;z-index:10}',
    '#mmPhAppbar .bk{cursor:pointer;color:#e66d6d;font-size:21px;line-height:1;padding:7px 12px 7px 8px;user-select:none;border-radius:10px;transition:transform .15s,opacity .15s}',
    '#mmPhAppbar .bk:active{transform:translateX(-2px);opacity:.7}',
    '#mmPhAppbar .t{position:absolute;left:44px;right:44px;text-align:center;pointer-events:none;',
    'font-family:"Songti SC","STZhongsong","Noto Serif SC","SimSun",serif;letter-spacing:.24em;color:#f0efe9;font-size:13.5px}',
    '#mmPhAppbar .t:after{content:"";position:absolute;left:50%;transform:translateX(-50%) skewX(-14deg);bottom:-4px;width:26px;height:2px;background:linear-gradient(90deg,transparent,#e62429 30%,#e62429 70%,transparent)}',
    // —— 屏幕（壁纸＋滚动区）——
    '#mmPhScreenWrap{flex:1;min-height:0;position:relative;border-radius:27px;overflow:hidden;',
    'background:radial-gradient(120% 85% at 20% -6%,#252e47 0%,#161b2b 42%,#0b0e17 80%),radial-gradient(50% 30% at 88% 106%,rgba(230,98,98,.075),transparent 70%),radial-gradient(40% 22% at 10% 108%,rgba(208,178,120,.05),transparent 70%)}',
    '#mmPhoneScreen{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-bottom:30px;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}',
    '#mmPhoneScreen::-webkit-scrollbar{width:3px}#mmPhoneScreen::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:2px}',
    // —— 桌面图标网格（5 列）——
    '#mmDesktop{display:grid;grid-template-columns:repeat(5,1fr);gap:16px 2px;padding:18px 10px 4px}',
    '#mmDesktop .app{cursor:pointer;user-select:none;text-align:center;transition:transform .18s cubic-bezier(.34,1.3,.5,1)}',
    '#mmDesktop .app:hover{transform:translateY(-2px)}',
    '#mmDesktop .app:active{transform:scale(.88)}',
    '#mmDesktop .app .ic{width:44px;height:44px;margin:0 auto;border-radius:13px;font-size:20px;line-height:44px;',
    'box-shadow:0 4px 12px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.18)}',
    '#mmDesktop .app .nm{font-size:9.5px;color:rgba(242,239,230,.92);letter-spacing:.05em;margin-top:5px;text-shadow:0 1px 3px rgba(0,0,0,.65);white-space:nowrap}',
    // —— 玻璃组件通用面（世界速览/角色速览/战况条）——
    '#mmPhWorldWg,#mmPhWidget,#mmPhFightbar{margin:6px 14px 0;padding:11px 15px;border-radius:18px;',
    'background:rgba(17,19,27,.52);backdrop-filter:blur(16px) saturate(1.25);-webkit-backdrop-filter:blur(16px) saturate(1.25);',
    'box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,255,255,.06);transition:transform .16s ease}',
    '#mmPhWorldWg:active,#mmPhWidget:active{transform:scale(.98)}',
    // —— 世界速览小组件 ——
    '#mmPhWorldWg .wgcap{font-size:9px;color:rgba(240,239,233,.42);letter-spacing:.26em;margin-right:8px}',
    '#mmPhWorldWg .wgline{margin-top:5px;font-size:11px;color:#a39f94;display:flex;align-items:center}',
    '#mmPhWorldWg .wgline b{color:#ecebe6;font-weight:600;font-variant-numeric:tabular-nums}',
    '#mmPhWorldWg .wt2{flex:1;height:3px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden;margin-left:8px}',
    '#mmPhWorldWg .wf2{display:block;height:100%;width:0;border-radius:2px;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    // —— 桌面底部战况条 ——
    '#mmPhFightbar .fbic{width:30px;height:30px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:14px;border-radius:9px;background:rgba(230,98,98,.13);clip-path:polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)}',
    '@keyframes mmHudPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(230,98,98,0))}50%{filter:drop-shadow(0 0 7px rgba(230,98,98,.55))}}',
    '#mmPhFightbar.live .fbic{animation:mmHudPulse 2s ease-in-out infinite}',
    '#mmPhFightbar .fblb{font-size:9px;color:rgba(240,239,233,.4);letter-spacing:.26em;white-space:nowrap}',
    '#mmPhFightbar .fbt{font-size:12px;color:#ecebe6;font-weight:600;white-space:nowrap}',
    '#mmPhFightbar .fbd{font-size:11px;color:#a39f94;white-space:normal;word-break:break-all}',
    // —— 角色"速览"小组件 ——
    '#mmPhWidget .wgnm{font-family:"Songti SC","STZhongsong","Noto Serif SC","SimSun",serif;font-size:15px;color:#f0efe9;letter-spacing:.12em}',
    '#mmPhWidget .wglv{font-size:10px;color:#d0b078;background:rgba(208,178,120,.14);padding:1px 9px;font-variant-numeric:tabular-nums;font-weight:600;clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)}',
    '#mmPhWidget .wgcap{margin-left:auto;font-size:9px;color:rgba(240,239,233,.4);letter-spacing:.26em}',
    '#mmPhWidget .wgbar{display:flex;align-items:center;gap:8px;margin:7px -6px 0;padding:2px 6px;border-radius:8px;transition:background .15s,transform .12s}',
    '#mmPhWidget .wgbar[data-ph-a]{cursor:pointer}#mmPhWidget .wgbar[data-ph-a]:hover{background:rgba(255,255,255,.055)}',
    '#mmPhWidget .wgbar[data-ph-a]:active{transform:scale(.985)}',
    '#mmPhWidget .wgch{margin-left:2px;color:rgba(240,239,233,.35);font-size:12px;line-height:1}',
    '#mmPhWidget .wggp{font-size:10px;border-radius:9px;padding:1px 8px;font-variant-numeric:tabular-nums;font-weight:600}',
    '#mmPhWidget .wggp.has{color:#e6c98f;background:rgba(208,178,120,.16)}',
    '#mmPhWidget .wggp.has:after{content:"";display:inline-block;width:4px;height:4px;border-radius:50%;background:#e62429;margin-left:6px;vertical-align:1px;animation:mmDotBlink 2s ease-in-out infinite}',
    '@keyframes mmDotBlink{0%,100%{opacity:.35}50%{opacity:1}}',
    '#mmPhWidget .wggp.zero{color:#8b887c;background:rgba(255,255,255,.05)}',
    '#mmPhWidget .wl{flex:0 0 24px;font-size:10px;color:#8b887c}',
    '#mmPhWidget .wt{flex:1;height:3px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden}',
    '#mmPhWidget .wf{display:block;height:100%;width:0;border-radius:2px;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhWidget .wv{flex:0 0 auto;font-size:10px;color:#a39f94;font-variant-numeric:tabular-nums}',
    // —— Home 条 ——
    '#mmPhHomebar{position:absolute;left:50%;bottom:5px;transform:translateX(-50%);width:104px;height:4px;border-radius:2px;',
    'background:rgba(240,239,233,.42);cursor:pointer;z-index:12;transition:background .2s,width .2s}',
    '#mmPhHomebar:hover{background:rgba(240,239,233,.8);width:120px}',
    // —— 应用页（近实底保对比＋缩放淡入＋子元素级联）——
    '@keyframes mmAppIn{from{opacity:0;transform:scale(.985) translateY(7px)}to{opacity:1;transform:none}}',
    '@keyframes mmFadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}',
    '#mmPhoneRoot .mm-app{display:none;padding:8px 16px 20px;background:rgba(11,13,18,.965);min-height:100%}',
    '#mmPhoneRoot .mm-app.on{display:block;animation:mmAppIn .28s cubic-bezier(.22,.8,.26,1)}',
    '#mmPhoneRoot .mm-app.on>*{animation:mmFadeUp .34s cubic-bezier(.22,.8,.26,1) backwards}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(2){animation-delay:.025s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(3){animation-delay:.05s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(4){animation-delay:.075s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(5){animation-delay:.1s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(n+6){animation-delay:.12s}',
    // —— 数据行与条 ——
    '#mmPhoneRoot .mm-sum{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 2px 3px;font-variant-numeric:tabular-nums}',
    '#mmPhoneRoot .mm-vbar{display:flex;align-items:center;gap:6px;min-width:80px}',
    '#mmPhoneRoot .mm-vbar .lb{color:#8b887c;font-size:10.5px;letter-spacing:.1em}',
    '#mmPhoneRoot .mm-vbar .tk{flex:1;height:3px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden;min-width:36px}',
    '#mmPhoneRoot .mm-vbar .fl{display:block;height:100%;border-radius:2px;width:0;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhoneRoot .mm-vbar .vv{font-size:11px;color:#ecebe6;font-variant-numeric:tabular-nums}',
    // —— 小节标题（overline：大间距灰字，无框线）——
    '#mmPhoneRoot .mm-sectitle{color:#8b887c;letter-spacing:.24em;margin:16px 2px 7px;font-size:9.5px;font-weight:600}',
    '#mmPhoneRoot .mm-sectitle:before{content:"";display:inline-block;width:3px;height:9px;background:linear-gradient(180deg,#e62429,#8f1d22);margin-right:8px;border-radius:1px;transform:skewX(-14deg);vertical-align:-1px}',
    '#mmPhoneRoot .mm-sectitle:first-child{margin-top:4px}',
    // —— 行式键值（label 灰左＋发丝底线）——
    '#mmPhoneRoot .mm-kv{margin:0;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.055);font-size:12.5px;color:#ecebe6}',
    '#mmPhoneRoot .mm-kv:last-of-type{border-bottom:none}',
    '#mmPhoneRoot .mm-kv b{color:#8b887c;font-weight:500;margin-right:10px;font-size:11px;letter-spacing:.08em}',
    '#mmPhoneRoot .mm-hint{font-size:10.5px;color:#7e7b71;line-height:1.65;margin:5px 2px 2px}',
    // —— 人物抬头（名＋徽章＋tag 胶囊化）——
    '#mmPhoneRoot .mm-idrow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:6px 0 4px}',
    '#mmPhoneRoot .mm-idrow .nm{font-family:"Songti SC","STZhongsong","Noto Serif SC","SimSun",serif;font-size:17px;color:#f0efe9;letter-spacing:.14em}',
    '#mmPhoneRoot .mm-idrow .tag{font-size:10px;color:#a39f94;background:rgba(255,255,255,.06);border-radius:9px;padding:1px 9px}',
    '#mmPhoneRoot .mm-idrow span[style*="margin-left:auto"]{background:rgba(208,178,120,.12);border:none;border-radius:10px;padding:1px 10px;color:#d0b078!important;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums}',
    // —— 四维瓦片（发丝面＋白数字）——
    '#mmPhoneRoot .mm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:9px 0 3px}',
    '#mmPhoneRoot .mm-cell{border-radius:13px;padding:10px 4px;text-align:center;background:rgba(255,255,255,.045);transition:transform .15s ease}',
    '#mmPhoneRoot .mm-cell b{display:block;font-size:16.5px;color:#f0efe9;font-variant-numeric:tabular-nums;font-weight:600;line-height:1.25}',
    '#mmPhoneRoot .mm-cell span{font-size:9px;color:#8b887c;letter-spacing:.26em}',
    // —— 加点/设值行（±圆形化）——
    '#mmPhoneRoot .mm-stat{display:flex;align-items:center;gap:8px;margin:6px 0}',
    '#mmPhoneRoot .mm-stat .mm-k{width:44px;color:#8b887c;font-size:11.5px;letter-spacing:.06em}',
    '#mmPhoneRoot .mm-stat .mm-v{min-width:20px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600;color:#f0efe9;font-size:13px}',
    // —— 战斗（保留类，桌面战况条也用）——
    '#mmPhoneRoot .mm-pip{color:#e66d6d;letter-spacing:2px}',
    // —— 按钮（胶囊＋按压反馈＋金 tint 主按钮）——
    '#mmPhoneRoot .mm-btn{min-height:27px;display:inline-flex;align-items:center;justify-content:center;padding:3px 14px;min-width:28px;text-align:center;',
    'background:rgba(255,255,255,.07);border:none;border-radius:999px;color:#ecebe6;cursor:pointer;user-select:none;font-size:11.5px;font-weight:500;transition:transform .14s ease,background .14s,color .14s}',
    '#mmPhoneRoot .mm-btn:hover{background:rgba(255,255,255,.1)}',
    '#mmPhoneRoot .mm-btn:active{transform:scale(.94);opacity:.85}',
    '#mmPhoneRoot .mm-stat .mm-btn{min-width:30px;min-height:30px;padding:0;border-radius:50%;background:rgba(255,255,255,.08);font-size:14px;font-weight:600}',
    '#mmPhoneRoot .mm-stat .mm-btn:hover{background:rgba(230,98,98,.18);color:#ef9d9d}',
    '#mmPhoneRoot .mm-btn.mm-go{background:rgba(230,98,98,.15);color:#ef9d9d;font-weight:600;letter-spacing:.14em}',
    '#mmPhoneRoot .mm-btn.mm-go:hover{background:rgba(230,98,98,.24)}',
    // —— 输入（沉浸黑面＋金细环聚焦）——
    '#mmPhoneRoot input,#mmPhoneRoot select,#mmPhoneRoot textarea{background:rgba(0,0,0,.32);color:#ecebe6;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:5px 10px;font-size:12px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    '#mmPhoneRoot input:focus{border-color:rgba(208,178,120,.45);box-shadow:0 0 0 1px rgba(208,178,120,.18)}',
    '#mmPhoneRoot .mm-papi{padding:13px 14px;background:rgba(255,255,255,.04);border-radius:16px}',
    '#mmPhoneRoot .mm-papi .mm-p-row{margin-bottom:11px}',
    '#mmPhoneRoot .mm-papi label{display:block;font-size:10px;letter-spacing:.14em;color:#8b887c;margin-bottom:5px}',
    '#mmPhoneRoot .mm-papi input,#mmPhoneRoot .mm-papi select{width:100%;padding:8px 11px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.08);border-radius:11px;outline:none}',
    '#mmPhoneRoot .mm-papi input:focus{border-color:rgba(208,178,120,.45);box-shadow:0 0 0 1px rgba(208,178,120,.18)}',
    '#mmPhoneRoot .mm-p-btns{display:flex;gap:9px;align-items:center;margin:2px 0 8px;flex-wrap:wrap}',
    '#mmPhoneRoot .mm-echo{font-size:11px;margin-top:4px;color:#8fb08a;min-height:14px;word-break:break-all}',
    // —— 升级行（发丝卡＋过渡进度）——
    '#mmPhoneRoot .mm-xprow{display:flex;align-items:center;gap:10px;margin:8px 0 4px;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.045);flex-wrap:wrap}',
    '#mmPhoneRoot .mm-xprow .xl{font-size:10px;color:#8b887c;white-space:nowrap;letter-spacing:.14em}',
    '#mmPhoneRoot .mm-xprow .xw{flex:1;height:4px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden;min-width:60px}',
    '#mmPhoneRoot .mm-xprow .xf{display:block;height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,#96793d,#d0b078);transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhoneRoot .mm-xprow .xv{font-size:11px;color:#ecebe6;white-space:nowrap;font-variant-numeric:tabular-nums}',
    // —— 模式开关行 ——
    '#mmPhoneRoot .mm-mode-row{display:flex;align-items:center;gap:8px;margin:6px 0;flex-wrap:wrap}',
    '#mmPhoneRoot .mm-mode-row .ml{flex:0 0 56px;font-size:10.5px;color:#8b887c;letter-spacing:.08em}',
    '#mmPhoneRoot .mm-mode-row .seg{display:flex;gap:5px;flex-wrap:wrap}',
    // —— 列表卡（技能/装备/关系：发丝面＋圆角）——
    '#mmPhoneRoot .mm-skill{margin:4px 0;padding:8px 12px;border-radius:13px;background:rgba(255,255,255,.045);font-size:11.5px;white-space:pre-line}',
    '#mmPhoneRoot .mm-cell2{border-radius:13px;padding:7px 12px;background:rgba(255,255,255,.045);margin:5px 0;font-size:11.5px}',
    '#mmPhoneRoot .mm-cell2 b{color:#f0efe9;font-weight:600}',
    // —— 日志（细分隔）——
    '#mmPhoneRoot .mm-log{max-height:300px;overflow-y:auto;font-size:11px;color:#a39f94;line-height:1.7;margin-top:2px}',
    '#mmPhoneRoot .mm-log div{padding:5px 2px;border-bottom:1px solid rgba(255,255,255,.045)}',
    '#mmPhoneRoot .mm-log div:last-child{border-bottom:none}',
    // —— 折叠区（顶部 HUD 刻度线）——
    '#mmPhoneRoot details summary{cursor:pointer;color:#d0b078;letter-spacing:.12em;font-size:12.5px;list-style:none;transition:opacity .15s;position:relative;padding-top:7px}',
    '#mmPhoneRoot details summary:before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(230,98,98,.4),rgba(230,98,98,.06) 70%,transparent)}',
    '#mmPhoneRoot details summary:active{opacity:.7}',
    '#mmPhoneRoot details summary::-webkit-details-marker{display:none}',
    // —— 引擎代渲染内容统一（裸 flex 行卡化＋小节 overline 化；!important 压引擎内联金）——
    '#mmPhoneRoot [data-mm-vmrels]>div:first-child,#mmPhoneRoot [data-mm-vmeq]>div:first-child,#mmPhoneRoot [data-mm-vmwk]>div:first-child,#mmPhoneRoot [data-mm-vmev]>div:first-child,#mmPhoneRoot [data-mm-vmst]>div:first-child,#mmPhoneRoot [data-mm-vmskill]>div:first-child{color:#8b887c!important;letter-spacing:.2em!important;font-size:9.5px!important;font-weight:600!important;border-bottom:1px solid rgba(255,255,255,.055)!important;margin:14px 2px 7px!important;padding-bottom:2px!important}',
    '#mmPhoneRoot [data-mm-vmrels]>div:first-child:before,#mmPhoneRoot [data-mm-vmeq]>div:first-child:before,#mmPhoneRoot [data-mm-vmwk]>div:first-child:before,#mmPhoneRoot [data-mm-vmskill]>div:first-child:before{content:"";display:inline-block;width:3px;height:9px;background:linear-gradient(180deg,#e62429,#8f1d22);margin-right:8px;border-radius:1px;transform:skewX(-14deg);vertical-align:-1px}',
    '#mmPhoneRoot [data-mm-vmrels]>div+div,#mmPhoneRoot [data-mm-vmeq]>div+div,#mmPhoneRoot [data-mm-vmwk]>div+div,#mmPhoneRoot [data-mm-vmev]>div+div,#mmPhoneRoot [data-mm-vmst]>div+div,#mmPhoneRoot [data-mm-vmskill]>div+div{background:rgba(255,255,255,.04);border-radius:11px;padding:6px 10px;margin:5px 0}',
    '#mmPhoneRoot span[data-mm-a^="vm-"]{border-radius:999px!important;border-color:rgba(255,255,255,.14)!important;color:#d9d4c7!important;background:rgba(255,255,255,.05)!important;transition:background .14s,border-color .14s,color .14s}',
    '#mmPhoneRoot span[data-mm-a^="vm-"]:hover{border-color:rgba(230,98,98,.5)!important;color:#ef9d9d!important;background:rgba(230,98,98,.1)!important}'
  ].join('');
  topDoc.head.appendChild(style);

  // ---------- 桌面＋九应用 DOM ----------
  const root = topDoc.createElement('div');
  root.id = 'mmPhoneRoot';
  root.className = 'mm-scope';
  root.setAttribute('data-mm-active-tab', '');
  // v0.2.0 信息架构重组（驾驶员令）：五应用——世界/战斗上桌面（组件/战况条），日志并入人物，
  // 加点/资源设值/技能并入设置；桌面（网格∪Dock）不放重复应用。
  const APPS = [
    ['persona', '📋', '人物'], ['bag', '🎒', '背包'], ['contacts', '📇', '联系人'],
    ['events', '📅', '事件'], ['settings', '⚙️', '设置'],
  ];
  // 图标块色板（现实手机 App 图标＝彩色圆角块＋压暗渐变）
  // v0.2.0 斯塔克·暗面：五瓦片统一漫威红渐变（官方 App 白 on 红瓦片语言；emoji glyph 自带色相在红底上成立）
  const 瓦红 = 'linear-gradient(150deg,#b32b30 0%,#8f1d22 55%,#6e1418 100%)';
  const 色板 = { persona: 瓦红, bag: 瓦红, contacts: 瓦红, events: 瓦红, settings: 瓦红 };
  const 瓦 = k => { const a = APPS.find(x => x[0] === k); return '<div class="app" data-ph-app="' + k + '"><div class="ic" style="background:' + 色板[k] + '">' + a[1] + '</div><div class="nm">' + a[2] + '</div></div>'; };
  const SVG信号 = '<svg width="15" height="11" viewBox="0 0 15 11"><rect x="0" y="7" width="2.6" height="4" rx="0.8" fill="currentColor"/><rect x="4" y="4.6" width="2.6" height="6.4" rx="0.8" fill="currentColor"/><rect x="8" y="2.4" width="2.6" height="8.6" rx="0.8" fill="currentColor"/><rect x="12" y="0" width="2.6" height="11" rx="0.8" fill="currentColor" opacity=".4"/></svg>';
  const SVGwifi = '<svg width="14" height="11" viewBox="0 0 14 11"><path d="M7 9.8 4.7 7.3a3.6 3.6 0 0 1 4.6 0Z" fill="currentColor"/><path d="M2.7 5.2a6.5 6.5 0 0 1 8.6 0L10 6.6a4.5 4.5 0 0 0-6 0Z" fill="currentColor" opacity=".78"/><path d="M.6 3a9.7 9.7 0 0 1 12.8 0l-1.3 1.4a7.8 7.8 0 0 0-10.2 0Z" fill="currentColor" opacity=".55"/></svg>';
  const SVG电池 = '<svg width="23" height="11" viewBox="0 0 23 11"><rect x="0.5" y="0.5" width="19" height="10" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="14.5" height="7" rx="1.8" fill="currentColor"/><path d="M21 3.4v4.2a2.1 2.1 0 0 0 0-4.2Z" fill="currentColor" opacity=".45"/></svg>';
  root.innerHTML = [
    '<div id="mmPhoneHead"><span class="clk" id="mmPhClock">…</span><span class="st">' + SVG信号 + SVGwifi + SVG电池 + '<span class="btp">87%</span></span><span class="ph-x" data-ph-a="ph-close" title="收起">✕</span><span id="mmPhIsland"></span></div>',
    '<div id="mmPhAppbar"><span class="bk" data-ph-a="ph-home" style="display:none">‹</span><span class="t" id="mmPhTitle">美漫 · 手机</span></div>',
    '<div id="mmPhScreenWrap">',
    '<div id="mmPhoneScreen">',
    '  <div id="mmDesktop">',
    APPS.map(a => '    ' + 瓦(a[0])).join('\n'),
    '  </div>',
    // 桌面小组件：世界速览（点开＝事件页，世界详情行都在那边）
    '  <div id="mmPhWorldWg" data-ph-a="ph-open" data-ph-tgt="events" title="打开事件与详情">',
    '    <div style="display:flex;align-items:center;gap:8px"><span class="wgcap" style="margin-left:0">世界</span><span class="wgnm" style="font-size:12.5px" id="mmPh电影">…</span></div>',
    '    <div class="wgline">节点 <b id="mmPh节点">…</b>｜阶段 <b id="mmPh阶段">…</b></div>',
    '    <div class="wgline" style="align-items:center;display:flex">干预度 <b id="mmPh干预度">…</b><span class="wt2"><span class="wf2" id="mmPh干预条" style="background:linear-gradient(90deg,#8a6f35,#c9a86a)"></span></span></div>',
    '  </div>',
    // 桌面小组件：角色速览（点开＝人物 App）
    '  <div id="mmPhWidget" data-ph-a="ph-open" data-ph-tgt="persona" title="打开人物">',
    '    <div style="display:flex;align-items:center;gap:8px"><span class="wgnm" id="mmPhWgNm">…</span><span class="wglv" id="mmPhWgLv"></span><span class="wggp" id="mmPhWgGp" style="display:none"></span><span class="wgcap">角色速览</span></div>',
    '    <div class="wgbar" data-ph-a="ph-open-res" title="点击前往设置调整"><span class="wl" style="color:#c05e5e">生命</span><span class="wt"><span class="wf" id="mmPhWg血条" style="background:linear-gradient(90deg,#8f2f2f,#c05e5e)"></span></span><span class="wv" id="mmPhWg血值"></span><span class="wgch">›</span></div>',
    '    <div class="wgbar" data-ph-a="ph-open-res" title="点击前往设置调整"><span class="wl" style="color:#6a89b5">法力</span><span class="wt"><span class="wf" id="mmPhWg蓝条" style="background:linear-gradient(90deg,#39557f,#6a89b5)"></span></span><span class="wv" id="mmPhWg蓝值"></span><span class="wgch">›</span></div>',
    '    <div class="wgbar" data-ph-a="ph-open-res" title="点击前往设置调整"><span class="wl" style="color:#7fa37a">体力</span><span class="wt"><span class="wf" id="mmPhWg体条" style="background:linear-gradient(90deg,#4f6b4a,#7fa37a)"></span></span><span class="wv" id="mmPhWg体值"></span><span class="wgch">›</span></div>',
    '  </div>',
    // 桌面底部战况条（替代原 Dock 位置：战斗不再设 App，状态直接显示在桌面）
    '  <div id="mmPhFightbar"><span class="fbic">⚔️</span><span class="fblb">战况</span><span class="fbt" id="mmPh战态">未在战斗</span><span class="fbd" id="mmPh战况"></span></div>',
    // ① 人物
    '  <div class="mm-app" data-ph-page="persona">',
    '    <div class="mm-idrow"><span class="nm" id="mmPhNm2">…</span><span class="tag" id="mmPhTag2"></span><span style="margin-left:auto;border:1px solid rgba(201,168,106,.28);border-radius:2px;padding:1px 10px;color:#c9a86a;font-size:12px" id="mmPhLv2"></span></div>',
    '    <div class="mm-kv" style="margin-bottom:2px"><b>能力</b><span id="mmPh能力" style="color:#e6c98f;font-weight:600"></span></div>',
    '    <div class="mm-grid">',
    '      <div class="mm-cell"><b data-mm-statv="攻击">…</b><span>攻击</span></div>',
    '      <div class="mm-cell"><b data-mm-statv="防御">…</b><span>防御</span></div>',
    '      <div class="mm-cell"><b data-mm-statv="敏捷">…</b><span>敏捷</span></div>',
    '      <div class="mm-cell"><b data-mm-statv="魅力">…</b><span>魅力</span></div>',
    '    </div>',
    '    <div class="mm-sum">',
    '      <span class="mm-vbar"><span class="lb" style="color:#c05e5e">生命</span><span class="tk"><span class="fl" id="mmPh血条" style="background:linear-gradient(90deg,#8f2f2f,#c05e5e)"></span></span><span class="vv" id="mmPh血值"></span></span>',
    '      <span class="mm-vbar"><span class="lb" style="color:#6a89b5">法力</span><span class="tk"><span class="fl" id="mmPh蓝条" style="background:linear-gradient(90deg,#39557f,#6a89b5)"></span></span><span class="vv" id="mmPh蓝值"></span></span>',
    '      <span class="mm-vbar"><span class="lb" style="color:#7fa37a">体力</span><span class="tk"><span class="fl" id="mmPh体条" style="background:linear-gradient(90deg,#4f6b4a,#7fa37a)"></span></span><span class="vv" id="mmPh体值"></span></span>',
    '    </div>',
    '    <div class="mm-kv"><b>状态效果</b><span id="mmPh状态效果"></span></div>',
    '    <div class="mm-kv" style="white-space:pre-line"><b>来历</b><span id="mmPh来历"></span></div>',
    '    <div class="mm-kv" style="white-space:pre-line"><b>外貌</b><span id="mmPh外貌"></span></div>',
    '    <div class="mm-sectitle">事件日志</div>',
    '    <div class="mm-log" id="mmPh日志"><span style="color:#a09a8a">（暂无记录）</span></div>',
    '  </div>',
    // ② 背包
    '  <div class="mm-app" data-ph-page="bag">',
    // v0.2.0 裸文字排查：删手机侧冗余小节题（引擎容器自带同名 overline 题＋计数，连排两根重复）
    '    <div data-mm-vmeq></div>',
    '    <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap"><input data-mm-eqin="名称" placeholder="装备名" style="flex:1 1 90px;background:#111318;border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px"><input data-mm-eqin="说明" placeholder="说明（可空）" style="flex:1 1 110px;background:#111318;border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px"><span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="vm-eq-add">添加</span></div>',
    '    <div data-mm-vmwk></div>',
    '    <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap"><input data-mm-wkin="描述" placeholder="弱点描述" style="flex:1 1 110px;background:#111318;border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px"><input data-mm-wkin="类别" placeholder="类别（可空）" style="flex:0 1 76px;background:#111318;border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px"><input data-mm-wkin="效果" placeholder="效果（可空）" style="flex:1 1 90px;background:#111318;border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px"><span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="vm-wk-add">添加</span></div>',
    '  </div>',
    // ⑥ 联系人
    '  <div class="mm-app" data-ph-page="contacts">',
    '    <div class="mm-hint">这里列出全部关系记录——一次性路人删掉不影响剧情；带「注册」标的是花名册剧情人物、好感≥40 是重要关系，删除要点两次确认。好感框填数字后点「设」（-100～100，封顶 100）。</div>',
    '    <div data-mm-vmrels></div>',
    '    <div style="margin-top:6px"><span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="vm-rel-clean">一键清路人</span><span class="mm-hint" data-mm-vmcleancount style="margin-left:8px"></span></div>',
    '    <div class="mm-hint" style="margin-top:8px;color:#c9a86a">📷 私信聊天（二期）将在这里接入。</div>',
    '  </div>',
    // ⑦ 事件（并世界详情：一览＋偏移记录）
    '  <div class="mm-app" data-ph-page="events">',
    '    <div class="mm-kv"><b>节点</b><span id="mmPhEv节点" style="color:#ecebe6;font-weight:600"></span><span style="margin:0 9px;color:rgba(255,255,255,.16)">｜</span><b>阶段</b><span id="mmPhEv阶段" style="color:#ecebe6;font-weight:600"></span></div>',
    '    <div class="mm-kv" style="white-space:pre-line"><b>世界事件一览</b><span id="mmPh事件一览"></span></div>',
    '    <div class="mm-hint">运转中事件与未收悬钩全量在此。删除＝本档不再追踪该事件（引擎会拦喂名式复活，误删可恢复）。进度框填新档位后点「设」。</div>',
    '    <div data-mm-vmev></div>',
    '    <div class="mm-kv" style="white-space:pre-line;color:#b3ad9f;font-size:11.5px;margin-top:8px"><b>最近偏移记录</b><span id="mmPh偏移"></span></div>',
    '  </div>',
    // ⑧ 设置（并成长加点／资源设值：查看在人物页，改动全归设置）
    '  <div class="mm-app" data-ph-page="settings">',
    '    <details open>',
    '      <summary>▸ 解析设置 <span style="color:#a09a8a;font-size:11px">给变量解析单独配模型／API（存本地浏览器）</span></summary>',
    '      <div class="mm-papi" style="margin-top:7px">',
    '        <div class="mm-p-row"><div class="mm-kv" style="margin:0 0 10px">变量解析默认跟随酒馆当前连接。额外端点跑不通时，解析与帮填都不会自动改用正文连接——会弹窗提示你删掉端点再重试。</div></div>',
    '        <div class="mm-p-row"><label>API 地址（OpenAI 兼容，含 /v1）</label><input id="mmApiUrl" placeholder="留空＝跟随酒馆当前连接"></div>',
    '        <div class="mm-p-row"><label>API Key</label><input id="mmApiKey" type="password" placeholder="sk-…"></div>',
    '        <div class="mm-p-row"><label>手动填模型名（与下拉二选一）</label><input id="mmApiModelManual" placeholder="例：gpt-4o-mini / deepseek-chat"></div>',
    '        <div class="mm-p-btns"><span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="parse-api-save">保存解析设置</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="parse-retry">↻ 重试解析上一楼</span></div>',
    '        <div class="mm-echo" id="mmApiEcho"></div>',
    '      </div>',
    '    </details>',
    '    <div class="mm-sectitle" style="margin-top:10px">成长与加点（0-10，升级自动获得的点数在此分配）</div>',
    '    <div class="mm-xprow">',
    '      <span class="xl">升级</span>',
    '      <span class="xw"><span class="xf" data-mm-xp></span></span>',
    '      <span class="xv" data-mm-gpshow>成长点 …</span>',
    '      <span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="upgrade" data-mm-up data-gp="" data-lv=""><span data-mm-uplb>升级</span></span>',
    '    </div>',
    '    <div class="mm-hint" data-mm-poolshow></div>',
    '    <div class="mm-stat"><span class="mm-k">攻击</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="攻击" data-mm-d="-1">−</span><span class="mm-v" data-mm-statv="攻击">…</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="攻击" data-mm-d="1">＋</span></div>',
    '    <div class="mm-stat"><span class="mm-k">防御</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="防御" data-mm-d="-1">−</span><span class="mm-v" data-mm-statv="防御">…</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="防御" data-mm-d="1">＋</span></div>',
    '    <div class="mm-stat"><span class="mm-k">敏捷</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="敏捷" data-mm-d="-1">−</span><span class="mm-v" data-mm-statv="敏捷">…</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="敏捷" data-mm-d="1">＋</span></div>',
    '    <div class="mm-stat"><span class="mm-k">魅力</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="魅力" data-mm-d="-1">−</span><span class="mm-v" data-mm-statv="魅力">…</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="stat" data-mm-k="魅力" data-mm-d="1">＋</span></div>',
    '    <div class="mm-sectitle" id="mmPhResAnchor" style="margin-top:10px">资源设值（0～上限，越界自动钳回）</div>',
    '    <div class="mm-stat"><span class="mm-k">生命</span><input data-mm-resin="血量" style="width:60px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px;border-radius:8px"><span tabindex="0" role="button" class="mm-btn" data-mm-a="vm-res" data-mm-k="血量">设</span><span class="mm-v" data-mm-resv="血量" style="color:#8b8676">…</span></div>',
    '    <div class="mm-stat"><span class="mm-k">法力</span><input data-mm-resin="蓝量" style="width:60px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px;border-radius:8px"><span tabindex="0" role="button" class="mm-btn" data-mm-a="vm-res" data-mm-k="蓝量">设</span><span class="mm-v" data-mm-resv="蓝量" style="color:#8b8676">…</span></div>',
    '    <div class="mm-stat"><span class="mm-k">体力</span><input data-mm-resin="体力" style="width:60px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#d9d4c7;font-size:11.5px;padding:1px 4px;border-radius:8px"><span tabindex="0" role="button" class="mm-btn" data-mm-a="vm-res" data-mm-k="体力">设</span><span class="mm-v" data-mm-resv="体力" style="color:#8b8676">…</span></div>',
    '    <div class="mm-sectitle" style="margin-top:10px">模式开关（随时可切）</div>',
    '    <div class="mm-mode-row"><span class="ml">成长节奏</span><span class="seg"><span tabindex="0" role="button" class="mm-btn" data-mm-a="growth-mode" data-mm-mode="困难">困难·原版</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="growth-mode" data-mm-mode="简单">简单·双倍</span></span></div>',
    '    <div class="mm-mode-row"><span class="ml">世界态度</span><span class="seg"><span tabindex="0" role="button" class="mm-btn" data-mm-a="hard-mode" data-mm-mode="普通">普通</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="hard-mode" data-mm-mode="困难">困难模式</span></span></div>',
    '    <div class="mm-mode-row"><span class="ml">乙女向</span><span class="seg"><span tabindex="0" role="button" class="mm-btn" data-mm-a="otome-mode" data-mm-mode="关">关</span><span tabindex="0" role="button" class="mm-btn" data-mm-a="otome-mode" data-mm-mode="开">乙女向</span></span></div>',
    '    <div class="mm-hint" style="margin-top:12px">技能增删改｜与加点页同一本账：新增耗 5 点成长点，改／删免费。</div>',
    '    <div data-mm-vmskill></div>',
    '    <div id="mmVarSkillForm"></div>',
    '    <span tabindex="0" role="button" class="mm-btn mm-go" data-mm-a="skill-form" data-mm-form="mmVarSkillForm">新增／编辑技能</span>',
    '  </div>',
    '</div>',
    '<div id="mmPhHomebar" data-ph-a="ph-gohome" title="回桌面"></div>',
    '</div>'
  ].join('');
  topDoc.body.appendChild(root);

  // FAB 启动钮
  const fab = topDoc.createElement('div');
  fab.id = 'mmPhoneFab';
  fab.textContent = '📱';
  fab.setAttribute('data-ph-a', 'ph-toggle');
  fab.title = '美漫手机';
  topDoc.body.appendChild(fab);

  // ---------- 导航 ----------
  const headBk = root.querySelector('#mmPhAppbar .bk');
  const headTitle = root.querySelector('#mmPhTitle');
  const desktop = root.querySelector('#mmDesktop');
  const appbar = root.querySelector('#mmPhAppbar');
  const 桌面组件 = [root.querySelector('#mmPhWidget'), root.querySelector('#mmPhWorldWg'), root.querySelector('#mmPhFightbar')];
  const 组件显隐 = show => { for (const w of 桌面组件) if (w) w.style.display = show ? (w.id === 'mmPhFightbar' ? 'flex' : 'block') : 'none'; };
  let 当前app = '';
  function 开app(app) {
    当前app = app;
    desktop.style.display = 'none';
    组件显隐(false); // 桌面组件（速览/世界/战况条）只属于桌面，App 页内不跟随
    appbar.style.display = 'flex';
    for (const pg of root.querySelectorAll('.mm-app')) pg.classList.toggle('on', pg.getAttribute('data-ph-page') === app);
    headBk.style.display = 'inline-block';
    const info = APPS.find(a => a[0] === app);
    headTitle.textContent = (info ? info[1] + ' ' : '') + (info ? info[2] : app);
    root.querySelector('#mmPhoneScreen').scrollTop = 0;
    if (app === 'persona') { fill人物(); fill日志(); } // 日志并入人物页
    else if (app === 'events') { fill容器(); fill世界(); } // 世界详情两行（一览/偏移）在事件页
    else if (app === 'settings') { fill容器(); fill加点区(); } // 成长数字首开填充（加点并入设置页）
    else fill容器(); // bag/contacts：懒渲染全容器（渲染变量管理一次过）
  }
  function 回桌面() {
    当前app = '';
    for (const pg of root.querySelectorAll('.mm-app')) pg.classList.remove('on');
    desktop.style.display = 'grid';
    组件显隐(true);
    appbar.style.display = 'none';
    headBk.style.display = 'none';
    headTitle.textContent = '美漫 · 手机';
    fill人物(); fill世界(); fill战斗(); // 桌面三组件刷新（回桌面必经路径）
  }
  topDoc.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest ? ev.target.closest('[data-ph-app]') : null;
    if (t) { 开app(t.getAttribute('data-ph-app')); }
  });

  // ---------- 手机自有动作（data-ph-a） ----------
  const clickListener = ev => {
    try {
      const b = ev.target && ev.target.closest ? ev.target.closest('[data-ph-a]') : null;
      if (!b) return;
      topWin.__mmPhone调试 = topWin.__mmPhone调试 || { 收到: 0 };
      topWin.__mmPhone调试.收到 = (topWin.__mmPhone调试.收到 || 0) + 1;
      const a = b.getAttribute('data-ph-a');
      const 桥 = topWin.__mmPhone桥;
      if (桥 && 桥.本卡 && !桥.本卡()) { try { topWin.toastr ? topWin.toastr.info('切到「美漫大世界」后再打开手机。', '美漫 · 手机') : 0; } catch (_) { } return; }
      if (a === 'ph-toggle') { root.style.display === 'flex' ? 收起() : (root.style.display = 'flex', 回桌面(), fill全部()); }
      else if (a === 'ph-close') { 收起(); }
      else if (a === 'ph-home' || a === 'ph-gohome') { 回桌面(); } // ph-gohome＝底部 Home 条（避免与导航栏返回键同名，探针选择器保持唯一命中）
      else if (a === 'ph-open') { 开app(b.getAttribute('data-ph-tgt') || ''); } // 桌面小组件点开（角色速览→人物／世界速览→事件）
      else if (a === 'ph-open-res') { // 角色速览资源条 → 设置页资源设值节（开页后锚点滚动；两段式——异步填充会改变上方布局，第二滚校正）
        开app('settings');
        const goRes = () => { const t = topDoc.getElementById('mmPhResAnchor'); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        setTimeout(goRes, 700);
        setTimeout(goRes, 1500);
      }
      else if (a === 'ph-refresh') { 当前app ? 开app(当前app) : fill全部(); }
    } catch (e) { console.warn(TAG, 'click 处理', e); }
  };
  function 收起() { root.style.display = 'none'; }
  topDoc.addEventListener('click', clickListener, true); // 捕获态：免疫中间层 stopPropagation
  topWin.__mmPhone调试 = { topDoc同源: topDoc === topWin.document, 收到: 0, 重挂: () => topDoc.addEventListener('click', clickListener, true) };

  function 打开() { root.style.display = 'flex'; 回桌面(); fill全部(); }
  function fill全部() {
    fill人物();
    fill世界();
    fill战斗();
    fill日志();
    fill加点区();
    fill容器();
  }

  // ---------- 各应用填充（数据面＝__mmPhone桥，显示面＝JS 填，不靠宏） ----------
  function fill人物() {
    return _读(st => {
      const 玩 = st.玩家 || {};
      const set = (id, v) => { const el = topDoc.getElementById(id); if (el) el.textContent = v; };
      set('mmPhNm2', 玩.姓名 || '…'); set('mmPhTag2', (玩.身份 || '') + '｜' + (玩.所属源 || ''));
      set('mmPhLv2', 'LV' + (玩.等级 || 1)); set('mmPh能力', 玩.能力组名 || '—');
      // v0.2.0 修正：状态效果在树里可能是数组（含空数组——空数组真值会绕过 || 兜底且串行化为空串）
      const 效果原 = 玩.状态效果;
      const 效果文 = Array.isArray(效果原) ? (效果原.length ? 效果原.join('、') : '无') : (效果原 || '无');
      set('mmPh状态效果', 效果文);
      set('mmPh来历', 玩.来历 || '（未记录）'); set('mmPh外貌', 玩.外貌 || '（未记录）');
      const 条 = (条id, 值id, 值, 上限) => {
        const 上 = Number(上限) || 0, v = Number(值) || 0;
        const el = topDoc.getElementById(条id); if (el) el.style.width = (上 > 0 ? Math.max(0, Math.min(100, v / 上 * 100)) : 0) + '%';
        set(值id, v + '/' + 上);
      };
      条('mmPh血条', 'mmPh血值', 玩.血量, 玩.血量上限);
      条('mmPh蓝条', 'mmPh蓝值', 玩.蓝量, 玩.蓝量上限);
      条('mmPh体条', 'mmPh体值', 玩.体力, 玩.体力上限);
      // v0.2.0 桌面"角色速览"小组件（与人物页同源；回桌面时会重新调 fill人物 刷新）
      const wset = (id, v) => { const el = topDoc.getElementById(id); if (el) el.textContent = v; };
      wset('mmPhWgNm', 玩.姓名 || '…'); wset('mmPhWgLv', 'LV' + (玩.等级 || 1));
      // v0.2.0 成长点角标（>0 金、=0 灰——把"该去设置花点"的引导放桌面）
      const gpN = Number(玩.成长点) || 0;
      const wgGp = topDoc.getElementById('mmPhWgGp');
      if (wgGp) { wgGp.textContent = '成长点 ' + gpN; wgGp.className = 'wggp ' + (gpN > 0 ? 'has' : 'zero'); wgGp.style.display = 'inline-block'; }
      const wbar = (条id, 值id, 值, 上限) => {
        const 上 = Number(上限) || 0, v = Number(值) || 0;
        const el = topDoc.getElementById(条id); if (el) el.style.width = (上 > 0 ? Math.max(0, Math.min(100, v / 上 * 100)) : 0) + '%';
        wset(值id, v + '/' + 上);
      };
      wbar('mmPhWg血条', 'mmPhWg血值', 玩.血量, 玩.血量上限);
      wbar('mmPhWg蓝条', 'mmPhWg蓝值', 玩.蓝量, 玩.蓝量上限);
      wbar('mmPhWg体条', 'mmPhWg体值', 玩.体力, 玩.体力上限);
      // v0.2.0 首开填充：四维瓦片（引擎就地刷新成长显示只在面板动作后跑，首开没人填——军规49① 渲染时点同族）
      for (const el of topDoc.querySelectorAll('[data-ph-page="persona"] [data-mm-statv]')) {
        const v = 玩.四维 && 玩.四维[el.getAttribute('data-mm-statv')];
        if (v !== undefined && v !== null) el.textContent = String(v);
      }
    });
  }
  function fill世界() {
    return _读(st => {
      const sy = st.system || {};
      const set = (id, v) => { const el = topDoc.getElementById(id); if (el) el.textContent = v; };
      set('mmPh电影', sy.当前电影 || '—'); set('mmPh节点', sy.当前节点 || '—'); set('mmPh阶段', sy.当前阶段 || '—');
      set('mmPhEv节点', sy.当前节点 || '—'); set('mmPhEv阶段', sy.当前阶段 || '—'); // 事件页"节点/阶段"行（独立 id 防与桌面组件重 id）
      set('mmPh事件一览', sy.事件一览 || '（暂无）'); set('mmPh偏移', st.世界线 && st.世界线.偏移记录 ? st.世界线.偏移记录 : '（无）');
      set('mmPh干预度', st.世界线 && st.世界线.干预度 !== undefined ? st.世界线.干预度 : '…');
      const 条 = topDoc.getElementById('mmPh干预条'); if (条) 条.style.width = (Math.max(0, Math.min(10, Number(st.世界线 && st.世界线.干预度) || 0)) * 10) + '%';
    });
  }
  function fill战斗() {
    return _读(st => {
      const 战 = st.战斗 || {};
      const 态 = topDoc.getElementById('mmPh战态'), 况 = topDoc.getElementById('mmPh战况');
      if (战.对手) {
        if (态) 态.textContent = '交战中';
        if (况) 况.innerHTML = '对手 <b style="color:#d9d4c7">' + esc(战.对手) + '</b>｜回合 ' + esc(战.回合) + '｜我方 <span class="mm-pip">' + pip(战.我方势头) + '</span>｜对手 <span class="mm-pip">' + pip(战.对手势头) + '</span>';
        const fb = topDoc.getElementById('mmPhFightbar'); if (fb) fb.classList.add('live'); // 交战中＝图标红光呼吸
      } else {
        if (态) 态.textContent = '未在战斗'; if (况) 况.textContent = '';
        const fb = topDoc.getElementById('mmPhFightbar'); if (fb) fb.classList.remove('live');
      }
    });
  }
  function fill日志() {
    return _读(st => {
      const 日 = (st.事件 && st.事件.事件日志) || [];
      const box = topDoc.getElementById('mmPh日志');
      if (!box) return;
      box.innerHTML = 日.length ? 日.map(l => '<div>' + esc(l) + '</div>').join('') : '<span style="color:#a09a8a">（暂无记录）</span>';
    });
  }
  function fill加点区() {
    return _读(st => {
      const 玩 = st.玩家 || {};
      const set = (id, v) => { const el = topDoc.getElementById(id); if (el) el.textContent = v; };
      set('mmPh技能摘要', 玩.技能摘要 || '（暂无）');
      // v0.2.0 首开填充：成长数字全套（与引擎 就地刷新成长显示 同口径——statv/成长点/升级钮/点池，
      // 首开没有动作触发引擎刷新，必须自己填齐；引擎后再动作仍由引擎就地刷新接管）
      const lv = Number(玩.等级) || 1, gp = Number(玩.成长点);
      const cost = 3 + Math.floor(lv / 5) || 1;
      const q = s => topDoc.querySelectorAll('[data-ph-page="settings"] ' + s);
      for (const el of q('[data-mm-statv]')) {
        const v = 玩.四维 && 玩.四维[el.getAttribute('data-mm-statv')];
        if (v !== undefined && v !== null) el.textContent = String(v);
      }
      for (const el of q('[data-mm-gpshow]')) el.textContent = '成长点 ' + (isFinite(gp) ? gp : '…');
      for (const el of q('[data-mm-xp]')) { if (isFinite(gp)) el.style.width = Math.max(0, Math.min(100, (gp / cost) * 100)) + '%'; }
      for (const el of q('[data-mm-up]')) {
        el.setAttribute('data-gp', String(isFinite(gp) ? gp : ''));
        el.setAttribute('data-lv', String(lv));
        const lb = el.querySelector('[data-mm-uplb]');
        if (lv >= 50) { el.style.opacity = '.45'; if (lb) lb.textContent = 'LV50 封顶'; continue; }
        const ok = isFinite(gp) && gp >= cost;
        el.style.opacity = ok ? '1' : '.45';
        if (lb) lb.textContent = ok ? ('升到 LV' + (lv + 1)) : ('升级还差 ' + Math.max(0, cost - (gp || 0)) + ' 点');
      }
      const 维 = ['攻击', '防御', '敏捷', '魅力'];
      const 池 = 8 + Math.floor(lv / 2);
      const 已用 = 维.reduce((a, x) => a + ((玩.四维 && Number(玩.四维[x])) || 0), 0);
      for (const el of q('[data-mm-poolshow]')) {
        el.textContent = '属性点池：已用 ' + 已用 + '／池 ' + 池 + '（8＋等级÷2）' + (已用 >= 池 ? '——满了，升级扩池；减号可腾位' : '，还可加 ' + (池 - 已用) + ' 点');
      }
    });
  }
  function fill容器() {
    // 懒渲染：渲染变量管理一次过填全部容器（关系/装备/弱点/事件/技能/资源只读值）
    const 桥 = topWin.__mmPhone桥;
    if (桥 && 桥.渲染变量管理) 桥.渲染变量管理(root).catch(e => console.warn(TAG, '容器渲染', e));
  }
  function _读(fn) {
    const 桥 = topWin.__mmPhone桥;
    if (!桥) return Promise.resolve();
    return Promise.resolve(桥.读玩家状态()).then(r => { if (r && r.st) fn(st(r)); }).catch(e => console.warn(TAG, '读状态', e));
    function st(r) { return r.st; }
  }

  // ---------- 拖拽（军规23：手柄唯一＋document 跟踪＋零捕获） ----------
  (function () {
    const head = topDoc.getElementById('mmPhoneHead');
    let 拖 = null;
    head.addEventListener('pointerdown', ev => {
      if (ev.target.closest('[data-ph-a]')) return;
      const r = root.getBoundingClientRect();
      拖 = { sx: ev.clientX, sy: ev.clientY, ol: r.left, ot: r.top };
      ev.preventDefault();
    });
    topDoc.addEventListener('pointermove', ev => {
      if (!拖) return;
      const nl = 拖.ol + (ev.clientX - 拖.sx), nt = 拖.ot + (ev.clientY - 拖.sy);
      root.style.left = Math.max(0, Math.min(topWin.innerWidth - 80, nl)) + 'px';
      root.style.top = Math.max(0, Math.min(topWin.innerHeight - 60, nt)) + 'px';
      root.style.right = 'auto'; root.style.bottom = 'auto';
    });
    topDoc.addEventListener('pointerup', () => {
      if (!拖) return;
      拖 = null;
      try { const r = root.getBoundingClientRect(); localStorage.setItem('mmPhonePos', JSON.stringify({ l: r.left, t: r.top })); } catch (_) { }
    });
    try {
      const 存 = JSON.parse(localStorage.getItem('mmPhonePos') || 'null');
      if (存 && isFinite(存.l) && isFinite(存.t)) { root.style.left = 存.l + 'px'; root.style.top = 存.t + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto'; }
    } catch (_) { }
  })();

  // —— 状态栏时钟（真实时间，20s 走针；重建时清旧针防双针） ——
  try { if (topWin.__mmPhoneClockIv) clearInterval(topWin.__mmPhoneClockIv); } catch (_) { }
  (function () {
    const tick = () => {
      const e = topDoc.getElementById('mmPhClock');
      if (!e) return;
      const d = new Date();
      e.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };
    tick();
    topWin.__mmPhoneClockIv = setInterval(tick, 20000);
  })();

  console.info(TAG, '手机面板 v0.2.0 就绪（手机拟真版·五应用＋桌面组件·第二作用域架构）');
})();
