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
    // ================= 设计系统 v4「争锋」（Marvel Rivals HUD：深蓝黑底＋亮金强调＋斜切/切角＋重磅斜体） =================
    // —— FAB 启动钮（切角金边）——
    '#mmPhoneFab{position:fixed;right:14px;bottom:86px;z-index:9998;width:46px;height:46px;',
    'clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);',
    'background:linear-gradient(160deg,#141b2c,#070b14);color:#f8c830;font-size:19px;line-height:46px;text-align:center;',
    'cursor:pointer;user-select:none;box-shadow:inset 0 0 0 1px rgba(248,200,48,.45);transition:transform .15s ease,box-shadow .15s}',
    '#mmPhoneFab:hover{box-shadow:inset 0 0 0 1px rgba(248,200,48,.9),0 0 18px rgba(248,200,48,.18)}#mmPhoneFab:active{transform:scale(.94)}',
    // —— 机身（bezel）——
    '#mmPhoneRoot{position:fixed;right:16px;bottom:30px;z-index:9999;width:332px;max-width:calc(100vw - 20px);',
    'height:min(684px,calc(100vh - 130px));display:none;flex-direction:column;padding:7px;',
    'background:#05070d;border-radius:38px;',
    'box-shadow:0 34px 90px rgba(0,0,0,.78),0 2px 12px rgba(0,0,0,.5),inset 0 0 0 1px rgba(140,170,220,.14);',
    'font-family:-apple-system,"SF Pro Text","SF Pro Display","PingFang SC","HarmonyOS Sans SC","MiSans","Microsoft YaHei UI","Segoe UI",system-ui,sans-serif;font-size:13px;line-height:1.65;color:#e8ecf4;',
    '-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}',
    '#mmPhoneRoot *{box-sizing:border-box}',
    '#mmPhoneRoot ::placeholder{color:#5a6373}',
    // —— 灵动岛 ——
    '#mmPhIsland{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:80px;height:20px;border-radius:10px;background:#000;z-index:12;pointer-events:none}',
    '#mmPhIsland:after{content:"";position:absolute;right:6px;top:6px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#232c3e,#04050a 70%)}',
    // —— 状态栏（拖拽手柄）——
    '#mmPhoneHead{display:flex;align-items:center;gap:8px;height:32px;flex:0 0 auto;padding:0 18px;cursor:move;user-select:none;position:relative;z-index:11}',
    '#mmPhoneHead .clk{font-size:12px;font-weight:700;color:#eef2f8;font-variant-numeric:tabular-nums;letter-spacing:.02em}',
    '#mmPhoneHead .st{margin-left:auto;display:flex;align-items:center;gap:5px;color:#eef2f8}',
    '#mmPhoneHead .st svg{display:block}',
    '#mmPhoneHead .btp{font-size:10.5px;color:#eef2f8;font-variant-numeric:tabular-nums}',
    '#mmPhoneHead .ph-x{cursor:pointer;color:rgba(238,242,248,.45);padding:0 2px 0 8px;font-size:13px;transition:color .15s}#mmPhoneHead .ph-x:hover{color:#f8c830}',
    // —— 共享 App 导航栏（重磅斜体标题＋金色双 chevron）——
    '#mmPhAppbar{display:none;align-items:center;height:46px;flex:0 0 auto;padding:0 6px;position:relative;z-index:10}',
    '#mmPhAppbar .bk{cursor:pointer;color:#f8c830;font-size:22px;line-height:1;padding:7px 12px 7px 8px;user-select:none;transition:transform .15s,opacity .15s}',
    '#mmPhAppbar .bk:active{transform:translateX(-3px);opacity:.65}',
    '#mmPhAppbar .t{position:absolute;left:44px;right:44px;text-align:center;pointer-events:none;transform:skewX(-8deg);',
    'font-weight:800;letter-spacing:.1em;color:#f4f6fa;font-size:16px;text-shadow:0 2px 10px rgba(248,200,48,.16)}',
    '#mmPhAppbar .t:after{content:"▸▸";position:absolute;left:50%;transform:translateX(-50%) skewX(8deg);bottom:-6px;width:auto;color:#f8c830;font-size:8px;letter-spacing:2px;text-shadow:none}',
    // —— 屏幕（深蓝黑渐变＋金/红氛围光）——
    '#mmPhScreenWrap{flex:1;min-height:0;position:relative;border-radius:31px;overflow:hidden;',
    'background:radial-gradient(130% 80% at 18% -8%,#141c30 0%,#0a0f1c 48%,#05070f 100%),radial-gradient(50% 26% at 92% 104%,rgba(248,200,48,.05),transparent 70%),radial-gradient(44% 24% at 4% 108%,rgba(230,36,41,.06),transparent 70%)}',
    // v0.2.0 移动端锚定修正：ST 移动端给 <html> 挂 transform+perspective（键盘处理），transformed 根会成为
    // position:fixed 后代的包含块 → FAB/面板的 bottom 解析到视口外（真机实测 FAB top=-130 完全不可见）。
    // 该类环境下改挂 absolute：ST 移动端 body 为 position:fixed 全屏盒，absolute 子元素反而正确锚定视口。
    '#mmPhoneFab.mm-anchor-abs{position:absolute!important}',
    '#mmPhoneRoot.mm-anchor-abs{position:absolute!important}',
    '#mmPhoneScreen{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-bottom:30px;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:rgba(248,200,48,.25) transparent}',
    '#mmPhoneScreen::-webkit-scrollbar{width:3px}#mmPhoneScreen::-webkit-scrollbar-thumb{background:rgba(248,200,48,.28);border-radius:2px}',
    // —— 桌面图标网格（5 列，切角金框瓦片）——
    '#mmDesktop{display:grid;grid-template-columns:repeat(5,1fr);gap:18px 2px;padding:22px 10px 6px}',
    '#mmDesktop .app{cursor:pointer;user-select:none;text-align:center;transition:transform .18s cubic-bezier(.34,1.3,.5,1)}',
    '#mmDesktop .app:hover{transform:translateY(-2px)}',
    '#mmDesktop .app:active{transform:scale(.9)}',
    '#mmDesktop .app .ic{width:46px;height:46px;margin:0 auto;display:flex;align-items:center;justify-content:center;',
    'clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px);',
    'background:linear-gradient(160deg,#e62429 0%,#9c1216 100%);',
    'box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}',
    '#mmDesktop .app .ic svg{display:block}',
    '#mmDesktop .app .nm{font-size:10px;color:rgba(238,242,248,.92);letter-spacing:.06em;margin-top:7px;font-weight:600;white-space:nowrap}',
    // —— 玻璃组件通用面（切角面板＋金发丝框）——
    '#mmPhWorldWg,#mmPhWidget,#mmPhFightbar{margin:7px 14px 0;padding:12px 16px;border-radius:2px;',
    'clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);',
    'background:linear-gradient(165deg,rgba(19,26,44,.82),rgba(8,12,22,.86));backdrop-filter:blur(16px) saturate(1.2);-webkit-backdrop-filter:blur(16px) saturate(1.2);',
    'box-shadow:inset 0 0 0 1px rgba(248,200,48,.2),0 10px 28px rgba(0,0,0,.4);transition:transform .16s ease}',
    '#mmPhWorldWg:active,#mmPhWidget:active{transform:scale(.98)}',
    // —— 世界速览小组件 ——
    '#mmPhWorldWg .wgcap{font-size:9.5px;color:#f8c830;letter-spacing:.24em;margin-right:8px;font-weight:800}',
    '#mmPhWorldWg .wgline{margin-top:6px;font-size:11.5px;color:#9aa3b5;display:flex;align-items:center}',
    '#mmPhWorldWg .wgline b{color:#eef2f8;font-weight:700;font-variant-numeric:tabular-nums}',
    '#mmPhWorldWg .wt2{flex:1;height:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-left:8px;clip-path:polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)}',
    '#mmPhWorldWg .wf2{display:block;height:100%;width:0;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    // —— 桌面底部战况条 ——
    '#mmPhFightbar .fbic{width:32px;height:32px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:14px;background:rgba(230,36,41,.2);clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}',
    '@keyframes mmHudPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(230,36,41,0))}50%{filter:drop-shadow(0 0 8px rgba(230,36,41,.6))}}',
    '#mmPhFightbar.live .fbic{animation:mmHudPulse 2s ease-in-out infinite}',
    '#mmPhFightbar .fblb{font-size:9.5px;color:#f8c830;letter-spacing:.24em;white-space:nowrap;font-weight:800}',
    '#mmPhFightbar .fbt{font-size:12.5px;color:#eef2f8;font-weight:700;white-space:nowrap}',
    '#mmPhFightbar .fbd{font-size:11.5px;color:#9aa3b5;white-space:normal;word-break:break-all}',
    // —— 角色"速览"小组件 ——
    '#mmPhWidget .wgnm{font-weight:800;font-size:16px;color:#f4f6fa;letter-spacing:.06em;transform:skewX(-6deg);display:inline-block}',
    '#mmPhWidget .wglv{font-size:10.5px;color:#0a0f1c;background:linear-gradient(160deg,#ffd75e,#f8c830);padding:2px 10px;font-variant-numeric:tabular-nums;font-weight:800;clip-path:polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)}',
    '#mmPhWidget .wgcap{margin-left:auto;font-size:9.5px;color:#f8c830;letter-spacing:.24em;font-weight:800}',
    '#mmPhWidget .wgbar{display:flex;align-items:center;gap:8px;margin:8px -6px 0;padding:3px 6px;transition:background .15s,transform .12s}',
    '#mmPhWidget .wgbar[data-ph-a]{cursor:pointer}#mmPhWidget .wgbar[data-ph-a]:hover{background:rgba(248,200,48,.07)}',
    '#mmPhWidget .wgbar[data-ph-a]:active{transform:scale(.985)}',
    '#mmPhWidget .wgch{margin-left:2px;color:rgba(238,242,248,.3);font-size:12px;line-height:1}',
    '#mmPhWidget .wggp{font-size:10.5px;padding:2px 10px;font-variant-numeric:tabular-nums;font-weight:800;clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)}',
    '#mmPhWidget .wggp.has{color:#0a0f1c;background:linear-gradient(160deg,#ffd75e,#f8c830);box-shadow:0 3px 12px rgba(248,200,48,.3)}',
    '#mmPhWidget .wggp.has:after{content:"";display:inline-block;width:4px;height:4px;background:#0a0f1c;margin-left:6px;vertical-align:1.5px;animation:mmDotBlink 2s ease-in-out infinite}',
    '@keyframes mmDotBlink{0%,100%{opacity:.3}50%{opacity:1}}',
    '#mmPhWidget .wggp.zero{color:#79818f;background:rgba(255,255,255,.07)}',
    '#mmPhWidget .wl{flex:0 0 26px;font-size:10px;color:#79818f;letter-spacing:.04em}',
    '#mmPhWidget .wt{flex:1;height:4px;background:rgba(255,255,255,.08);overflow:hidden;clip-path:polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)}',
    '#mmPhWidget .wf{display:block;height:100%;width:0;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhWidget .wv{flex:0 0 auto;font-size:10.5px;color:#9aa3b5;font-variant-numeric:tabular-nums}',
    // —— Home 条 ——
    '#mmPhHomebar{position:absolute;left:50%;bottom:5px;transform:translateX(-50%);width:104px;height:4px;border-radius:2px;',
    'background:rgba(238,242,248,.4);cursor:pointer;z-index:12;transition:background .2s,width .2s}',
    '#mmPhHomebar:hover{background:rgba(238,242,248,.8);width:120px}',
    // —— 应用页（近实底＋缩放淡入＋级联）——
    '@keyframes mmAppIn{from{opacity:0;transform:scale(.985) translateY(7px)}to{opacity:1;transform:none}}',
    '@keyframes mmFadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}',
    '#mmPhoneRoot .mm-app{display:none;padding:10px 17px 22px;background:rgba(6,9,16,.975);min-height:100%}',
    '#mmPhoneRoot .mm-app.on{display:block;animation:mmAppIn .28s cubic-bezier(.22,.8,.26,1)}',
    '#mmPhoneRoot .mm-app.on>*{animation:mmFadeUp .34s cubic-bezier(.22,.8,.26,1) backwards}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(2){animation-delay:.025s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(3){animation-delay:.05s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(4){animation-delay:.075s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(5){animation-delay:.1s}',
    '#mmPhoneRoot .mm-app.on>*:nth-child(n+6){animation-delay:.12s}',
    // —— 数据行与条（斜切分段条）——
    '#mmPhoneRoot .mm-sum{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 2px 4px;font-variant-numeric:tabular-nums}',
    '#mmPhoneRoot .mm-vbar{display:flex;align-items:center;gap:7px;min-width:80px}',
    '#mmPhoneRoot .mm-vbar .lb{color:#79818f;font-size:10.5px;letter-spacing:.08em}',
    '#mmPhoneRoot .mm-vbar .tk{flex:1;height:4px;background:rgba(255,255,255,.08);overflow:hidden;min-width:36px;clip-path:polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)}',
    '#mmPhoneRoot .mm-vbar .fl{display:block;height:100%;width:0;transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhoneRoot .mm-vbar .vv{font-size:11.5px;color:#eef2f8;font-variant-numeric:tabular-nums;font-weight:650}',
    // —— 小节标题（金色斜体重磅＋双 chevron）——
    '#mmPhoneRoot .mm-sectitle{color:#f8c830;letter-spacing:.16em;margin:18px 2px 8px;font-size:10.5px;font-weight:800;transform:skewX(-6deg)}',
    '#mmPhoneRoot .mm-sectitle:before{content:"▸▸ ";letter-spacing:1px}',
    '#mmPhoneRoot .mm-sectitle:first-child{margin-top:4px}',
    // —— 行式键值（label 金灰＋发丝底线）——
    '#mmPhoneRoot .mm-kv{margin:0;padding:9px 2px;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;color:#e8ecf4}',
    '#mmPhoneRoot .mm-kv:last-of-type{border-bottom:none}',
    '#mmPhoneRoot .mm-kv b{color:#f8c830;font-weight:650;margin-right:10px;font-size:11px;letter-spacing:.08em}',
    '#mmPhoneRoot .mm-hint{font-size:11px;color:#79818f;line-height:1.7;margin:6px 2px 2px}',
    // —— 人物抬头（重磅斜体名＋切角徽章）——
    '#mmPhoneRoot .mm-idrow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:7px 0 5px}',
    '#mmPhoneRoot .mm-idrow .nm{font-weight:800;font-size:20px;color:#f4f6fa;letter-spacing:.05em;transform:skewX(-6deg);display:inline-block;text-shadow:0 2px 12px rgba(248,200,48,.14)}',
    '#mmPhoneRoot .mm-idrow .tag{font-size:10.5px;color:#9aa3b5;background:rgba(255,255,255,.06);clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);padding:3px 11px}',
    '#mmPhoneRoot .mm-idrow span[style*="margin-left:auto"]{background:linear-gradient(160deg,#ffd75e,#f8c830);border:none;color:#0a0f1c!important;font-size:11px;font-weight:800;font-variant-numeric:tabular-nums;clip-path:polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px);padding:3px 11px}',
    // —— 四维瓦片（切角深面＋白数字＋金标签）——
    '#mmPhoneRoot .mm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 4px}',
    '#mmPhoneRoot .mm-cell{padding:12px 4px;text-align:center;background:linear-gradient(165deg,#131a2c,#0a0f1c);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);box-shadow:inset 0 0 0 1px rgba(248,200,48,.16);transition:transform .15s ease}',
    '#mmPhoneRoot .mm-cell b{display:block;font-size:20px;color:#f4f6fa;font-variant-numeric:tabular-nums;font-weight:800;line-height:1.2}',
    '#mmPhoneRoot .mm-cell span{font-size:9.5px;color:#f8c830;letter-spacing:.2em;font-weight:700}',
    // —— 加点/设值行 ——
    '#mmPhoneRoot .mm-stat{display:flex;align-items:center;gap:9px;margin:7px 0}',
    '#mmPhoneRoot .mm-stat .mm-k{width:46px;color:#9aa3b5;font-size:12px;letter-spacing:.04em}',
    '#mmPhoneRoot .mm-stat .mm-v{min-width:22px;text-align:center;font-variant-numeric:tabular-nums;font-weight:800;color:#f4f6fa;font-size:15px}',
    // —— 战斗（保留类）——
    '#mmPhoneRoot .mm-pip{color:#f8c830;letter-spacing:2px}',
    // —— 按钮（斜切平行四边形：主金/次深/危红）——
    '#mmPhoneRoot .mm-btn{min-height:34px;display:inline-flex;align-items:center;justify-content:center;padding:0 18px;min-width:32px;text-align:center;',
    'background:rgba(255,255,255,.07);border:none;color:#eef2f8;cursor:pointer;user-select:none;font-size:13px;font-weight:700;white-space:nowrap;',
    'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);transition:transform .14s ease,background .14s,color .14s,box-shadow .14s}',
    '#mmPhoneRoot .mm-btn:hover{background:rgba(248,200,48,.14);color:#ffd75e}',
    '#mmPhoneRoot .mm-btn:active{transform:scale(.95)}',
    '#mmPhoneRoot .mm-stat .mm-btn{min-width:34px;min-height:34px;padding:0;background:rgba(255,255,255,.08);font-size:15px;font-weight:800;clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}',
    '#mmPhoneRoot .mm-stat .mm-btn:hover{background:rgba(248,200,48,.2);color:#ffd75e}',
    '#mmPhoneRoot .mm-btn.mm-go{background:linear-gradient(160deg,#ffd75e,#f8c830);color:#0a0f1c;font-weight:800;letter-spacing:.06em;box-shadow:0 6px 20px rgba(248,200,48,.3)}',
    '#mmPhoneRoot .mm-btn.mm-go:hover{background:linear-gradient(160deg,#ffe484,#ffd04a)}',
    '#mmPhoneRoot .mm-btn.mm-danger{background:rgba(230,36,41,.24);color:#ff8a8e}',
    // —— 输入（深蓝填充＋金环聚焦，锐角）——
    '#mmPhoneRoot input,#mmPhoneRoot select,#mmPhoneRoot textarea{background:#0d1220;color:#e8ecf4;border:1px solid rgba(255,255,255,.14);border-radius:2px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    '#mmPhoneRoot input:focus{border-color:rgba(248,200,48,.75);box-shadow:0 0 0 3px rgba(248,200,48,.12)}',
    '#mmPhoneRoot .mm-papi{padding:14px 15px;background:linear-gradient(165deg,rgba(19,26,44,.7),rgba(8,12,22,.8));border-radius:2px;box-shadow:inset 0 0 0 1px rgba(248,200,48,.18);clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}',
    '#mmPhoneRoot .mm-papi .mm-p-row{margin-bottom:12px}',
    '#mmPhoneRoot .mm-papi label{display:block;font-size:10px;letter-spacing:.14em;color:#f8c830;margin-bottom:6px;font-weight:800}',
    '#mmPhoneRoot .mm-papi input,#mmPhoneRoot .mm-papi select{width:100%;padding:10px 12px;background:#0d1220;border:1px solid rgba(255,255,255,.14);border-radius:2px;outline:none}',
    '#mmPhoneRoot .mm-papi input:focus{border-color:rgba(248,200,48,.75);box-shadow:0 0 0 3px rgba(248,200,48,.12)}',
    '#mmPhoneRoot .mm-p-btns{display:flex;gap:9px;align-items:center;margin:2px 0 8px;flex-wrap:wrap}',
    '#mmPhoneRoot .mm-echo{font-size:11px;margin-top:4px;color:#8fb08a;min-height:14px;word-break:break-all}',
    // —— 升级行（金色斜纹能量条）——
    '#mmPhoneRoot .mm-xprow{display:flex;align-items:center;gap:10px;margin:9px 0 5px;padding:13px 15px;background:linear-gradient(165deg,rgba(19,26,44,.7),rgba(8,12,22,.8));box-shadow:inset 0 0 0 1px rgba(248,200,48,.18);clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px);flex-wrap:wrap}',
    '#mmPhoneRoot .mm-xprow .xl{font-size:10.5px;color:#f8c830;white-space:nowrap;letter-spacing:.12em;font-weight:800}',
    '#mmPhoneRoot .mm-xprow .xw{flex:1;height:5px;background:rgba(255,255,255,.08);overflow:hidden;min-width:60px;clip-path:polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)}',
    '#mmPhoneRoot .mm-xprow .xf{display:block;height:100%;width:0;background:repeating-linear-gradient(-55deg,#f8c830 0 6px,#c79a1e 6px 12px);transition:width .5s cubic-bezier(.22,.61,.36,1)}',
    '#mmPhoneRoot .mm-xprow .xv{font-size:11.5px;color:#eef2f8;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:650}',
    // —— 模式开关行 ——
    '#mmPhoneRoot .mm-mode-row{display:flex;align-items:center;gap:8px;margin:7px 0;flex-wrap:wrap}',
    '#mmPhoneRoot .mm-mode-row .ml{flex:0 0 58px;font-size:11px;color:#9aa3b5;letter-spacing:.04em}',
    '#mmPhoneRoot .mm-mode-row .seg{display:flex;gap:6px;flex-wrap:wrap}',
    // —— 列表卡（切角深面）——
    '#mmPhoneRoot .mm-skill{margin:5px 0;padding:10px 13px;background:linear-gradient(165deg,rgba(19,26,44,.65),rgba(8,12,22,.75));box-shadow:inset 0 0 0 1px rgba(248,200,48,.14);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);font-size:12.5px;white-space:pre-line}',
    '#mmPhoneRoot .mm-cell2{padding:9px 13px;background:linear-gradient(165deg,rgba(19,26,44,.65),rgba(8,12,22,.75));box-shadow:inset 0 0 0 1px rgba(248,200,48,.14);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);margin:6px 0;font-size:12.5px}',
    '#mmPhoneRoot .mm-cell2 b{color:#f4f6fa;font-weight:700}',
    // —— 日志（细分隔）——
    '#mmPhoneRoot .mm-log{max-height:300px;overflow-y:auto;font-size:11.5px;color:#9aa3b5;line-height:1.75;margin-top:2px}',
    '#mmPhoneRoot .mm-log div{padding:6px 2px;border-bottom:1px solid rgba(255,255,255,.05)}',
    '#mmPhoneRoot .mm-log div:last-child{border-bottom:none}',
    // —— 折叠区（金色发丝顶线）——
    '#mmPhoneRoot details summary{cursor:pointer;color:#f4f6fa;letter-spacing:.08em;font-size:13px;font-weight:700;list-style:none;transition:opacity .15s;position:relative;padding-top:9px}',
    '#mmPhoneRoot details summary:before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(248,200,48,.55),rgba(248,200,48,.08) 70%,transparent)}',
    '#mmPhoneRoot details summary:active{opacity:.7}',
    '#mmPhoneRoot details summary::-webkit-details-marker{display:none}',
    // —— 引擎代渲染内容统一（行卡化＋金色 overline；!important 压引擎内联）——
    '#mmPhoneRoot [data-mm-vmrels]>div:first-child,#mmPhoneRoot [data-mm-vmeq]>div:first-child,#mmPhoneRoot [data-mm-vmwk]>div:first-child,#mmPhoneRoot [data-mm-vmev]>div:first-child,#mmPhoneRoot [data-mm-vmst]>div:first-child,#mmPhoneRoot [data-mm-vmskill]>div:first-child{color:#f8c830!important;letter-spacing:.16em!important;font-size:10.5px!important;font-weight:800!important;border-bottom:1px solid rgba(248,200,48,.25)!important;margin:15px 2px 8px!important;padding-bottom:3px!important;transform:skewX(-6deg)}',
    '#mmPhoneRoot [data-mm-vmrels]>div+div,#mmPhoneRoot [data-mm-vmeq]>div+div,#mmPhoneRoot [data-mm-vmwk]>div+div,#mmPhoneRoot [data-mm-vmev]>div+div,#mmPhoneRoot [data-mm-vmst]>div+div,#mmPhoneRoot [data-mm-vmskill]>div+div{background:linear-gradient(165deg,rgba(19,26,44,.65),rgba(8,12,22,.75));box-shadow:inset 0 0 0 1px rgba(248,200,48,.14);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);padding:8px 12px;margin:6px 0}',
    '#mmPhoneRoot span[data-mm-a^="vm-"]{border:none!important;color:#eef2f8!important;background:rgba(255,255,255,.08)!important;padding:6px 14px!important;min-height:28px;transition:background .14s,color .14s;font-weight:700;clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)!important;border-radius:0!important}',
    '#mmPhoneRoot span[data-mm-a^="vm-"]:hover{background:rgba(248,200,48,.18)!important;color:#ffd75e!important}',
    // —— 聊天页（v3.53c 一期：玩家主动发起/邀约）——
    '#mmPhThread{display:flex;flex-direction:column;gap:7px;padding:4px 2px 10px;min-height:200px}',
    '#mmPhThread .mm-bub{max-width:82%;padding:7px 11px;font-size:12px;line-height:1.55;white-space:pre-line;word-break:break-word;clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}',
    '#mmPhThread .mm-bub.me{align-self:flex-end;background:linear-gradient(160deg,#e62429,#a8161a);color:#fff;border-bottom-right-radius:2px}',
    '#mmPhThread .mm-bub.ta{align-self:flex-start;background:#171b28;color:#e8ecf4;border-bottom-left-radius:2px;box-shadow:inset 0 0 0 1px rgba(248,200,48,.18)}',
    '#mmPhThread .mm-bub.sys{align-self:center;background:none;color:#f8c830;font-size:10px;padding:2px 6px;letter-spacing:.06em}',
    '#mmPhThread .mm-bub.me.ta-wait{opacity:.65}',
    '#mmPhInvites{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 6px}',
    '#mmPhInvites .mm-inv{font-size:11px;padding:4px 12px;color:#ffd75e;background:rgba(248,200,48,.1);cursor:pointer;user-select:none;clip-path:polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px);transition:background .14s}',
    '#mmPhInvites .mm-inv:hover{background:rgba(248,200,48,.2)}',
    '#mmPhChatRow{display:flex;gap:7px;align-items:stretch}',
    '#mmPhChatIn{flex:1;background:#0d1220;color:#e8ecf4;border:1px solid rgba(255,255,255,.14);border-radius:2px;padding:9px 11px;font-size:12.5px;font-family:inherit;outline:none;resize:none;min-height:38px}',
    '#mmPhChatIn:focus{border-color:rgba(248,200,48,.75);box-shadow:0 0 0 3px rgba(248,200,48,.1)}',
    '#mmPhChatSend{flex:0 0 auto;display:flex;align-items:center;justify-content:center;padding:0 16px;background:linear-gradient(160deg,#ffd75e,#f8c830);color:#0a0f1c;border:none;font-weight:800;font-size:13px;cursor:pointer;clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)}',
    '#mmPhChatSend:disabled{opacity:.5;cursor:wait}',
    '#mmPhChatHint{font-size:10.5px;color:#6e6c68;margin-top:6px;line-height:1.6}',
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
    ['persona', '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5.5 19c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4"/></svg>', '人物'], ['bag', '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-.9 11.2A1.8 1.8 0 0 1 15.3 21H8.7a1.8 1.8 0 0 1-1.8-1.8L6 8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>', '背包'], ['contacts', '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M15.5 6.6a3 3 0 0 1 0 4.8M17.5 14.6c1.7.7 2.7 2.2 3 4.4"/></svg>', '联系人'],
    ['events', '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>', '事件'], ['settings', '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.9 19.1l1.9-1.9M17.2 6.8l1.9-1.9"/></svg>', '设置'],
  ];
  // 图标块色板（现实手机 App 图标＝彩色圆角块＋压暗渐变）
  // v0.2.0 斯塔克·暗面：五瓦片统一漫威红渐变（官方 App 白 on 红瓦片语言；emoji glyph 自带色相在红底上成立）
  const 瓦红 = 'linear-gradient(180deg,#ee2a2f 0%,#d01f24 100%)'; // v3：扁平红面（去 3D 压暗渐变）
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
    '    <div class="wgline" style="align-items:center;display:flex">干预度 <b id="mmPh干预度">…</b><span class="wt2"><span class="wf2" id="mmPh干预条" style="background:repeating-linear-gradient(-55deg,#f8c830 0 6px,#c79a1e 6px 12px)"></span></span></div>',
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
    '    <div class="mm-kv" style="margin-bottom:2px"><b>能力</b><span id="mmPh能力" style="color:#fff;font-weight:600"></span></div>',
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
    '    <div class="mm-kv" style="border-bottom:none;padding-bottom:2px"><b>状态效果</b></div>',
    '    <div id="mmPh状态效果"></div>',
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
    '    <div class="mm-hint" style="margin-top:8px;color:#f8c830">💬 私信已上线：点上方关系卡的「私聊」直接开聊（走设置页独立 API，对话影响好感）。</div>',
    '  </div>',
    // ⑦ 事件（并世界详情：一览＋偏移记录）
    '  <div class="mm-app" data-ph-page="events">',
    '    <div class="mm-kv"><b>节点</b><span id="mmPhEv节点" style="color:#f4f3ef;font-weight:600"></span><span style="margin:0 9px;color:rgba(255,255,255,.16)">｜</span><b>阶段</b><span id="mmPhEv阶段" style="color:#f4f3ef;font-weight:600"></span></div>',
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
    // ⑥ 聊天（v3.53c 一期：玩家主动发起；入口在联系人页每张关系卡的「私聊」钮）
    '  <div class="mm-app" data-ph-page="chat">',
    '    <div class="mm-hint" id="mmPhChatHint">私信走你在设置页填的独立 API；对话会真实影响好感与关系。邀约对方按好感决定接不接受。</div>',
    '    <div id="mmPhThread"><span style="color:#6e6c68;font-size:11px">（从联系人页点「私聊」开始对话）</span></div>',
    '    <div id="mmPhInvites">' +
      ['约出来见面', '组队行动', '问个情报', '道歉'].map(t => '<span class="mm-inv" tabindex="0" role="button" data-ph-a="ph-invite" data-ph-t="' + t + '">✉ ' + t + '</span>').join('') +
    '</div>',
    '    <div id="mmPhChatRow"><textarea id="mmPhChatIn" rows="1" placeholder="输入私信…（Enter 发送）"></textarea><span tabindex="0" role="button" id="mmPhChatSend" data-ph-a="ph-chatsend">发送</span></div>',
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

  // —— 移动端锚定模式（v0.2.0）：根元素被 transform/perspective 变换时，fixed 的包含块被改写 →
  // 改挂 absolute（ST 移动端 body 是全屏 fixed 盒，absolute 锚定视口正确）。启动＋窗口变化时重判。
  function 同步锚定模式() {
    try {
      const cs = (topWin.getComputedStyle || getComputedStyle)(topDoc.documentElement);
      const 根被变换 = (cs.transform && cs.transform !== 'none') || (cs.perspective && cs.perspective !== 'none');
      const 用绝对 = !!根被变换;
      fab.classList.toggle('mm-anchor-abs', 用绝对);
      root.classList.toggle('mm-anchor-abs', 用绝对);
      return 用绝对;
    } catch (_) { return false; }
  }
  topWin.__mm锚定 = 同步锚定模式();
  try { topWin.addEventListener('resize', 同步锚定模式); topWin.addEventListener('orientationchange', 同步锚定模式); } catch (_) { }

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
    headTitle.textContent = info ? info[2] : app; // v3：现代应用栏只放名字（图标已 SVG 化）
    root.querySelector('#mmPhoneScreen').scrollTop = 0;
    if (app === 'persona') { fill人物(); fill日志(); } // 日志并入人物页
    else if (app === 'events') { fill容器(); fill世界(); } // 世界详情两行（一览/偏移）在事件页
    else if (app === 'settings') { fill容器(); fill加点区(); } // 成长数字首开填充（加点并入设置页）
    else if (app === 'chat') { fill聊天(); } // v3.53c 聊天页（线程由 fill聊天 实读）
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
      else if (a === 'ph-chat') { 开聊天页(b.getAttribute('data-ph-k') || ''); } // v3.53c 联系人卡「私聊」入口
      else if (a === 'ph-invite') { const inp = topDoc.getElementById('mmPhChatIn'); if (inp) { inp.value = '「' + (b.getAttribute('data-ph-t') || '') + '」——'; inp.focus(); } }
      else if (a === 'ph-chatsend') { 发私信流程(); }
    } catch (e) { console.warn(TAG, 'click 处理', e); }
  };
  function 收起() { root.style.display = 'none'; }
  topDoc.addEventListener('click', clickListener, true); // 捕获态：免疫中间层 stopPropagation
  topWin.__mmPhone调试 = { topDoc同源: topDoc === topWin.document, 收到: 0, 重挂: () => topDoc.addEventListener('click', clickListener, true) };

  // ---------- v3.53c 聊天页 ----------
  let 当前聊天名 = '';
  let 聊天发送中 = false;
  function 开聊天页(名) {
    当前聊天名 = String(名 || '').trim();
    if (!当前聊天名) return;
    开app('chat');
    headTitle.textContent = 当前聊天名;
  }
  function fill聊天() {
    const 桥 = topWin.__mmPhone桥;
    const 线程盒 = topDoc.getElementById('mmPhThread');
    if (!线程盒 || !桥 || !当前聊天名) return;
    Promise.resolve(桥.读私信(当前聊天名)).then(r => {
      const 线 = (r && r.线程) || [];
      线程盒.innerHTML = 线.length ? 线.map(x => {
        if (x.s === '系') return '<div class="mm-bub sys">' + esc(x.t) + '</div>';
        const 类 = x.s === '我' ? 'me' : 'ta';
        const 文 = String(x.t || '').replace(/<好感\s*[|｜]?\s*[+-]?\d+\s*>/g, '').trim(); // 渲染兜底剥标记
        const 前缀 = x.k ? '<div style="font-size:9.5px;color:rgba(255,255,255,.55);margin-bottom:2px">✉ ' + esc(x.k) + '邀约</div>' : '';
        return '<div class="mm-bub ' + 类 + '">' + 前缀 + esc(文 || x.t) + '</div>';
      }).join('') : '<span style="color:#6e6c68;font-size:11px">（还没有对话——发第一条私信）</span>';
      const sc = root.querySelector('#mmPhoneScreen'); if (sc) sc.scrollTop = sc.scrollHeight;
      const 输 = topDoc.getElementById('mmPhChatIn');
      const 发 = topDoc.getElementById('mmPhChatSend');
      if (发) 发.disabled = !!聊天发送中;
      if (输入占位更新) 输入占位更新();
    }).catch(e => console.warn(TAG, '读私信', e));
  }
  function 输入占位更新() {
    const 输 = topDoc.getElementById('mmPhChatIn');
    if (!输) return;
    const 桥 = topWin.__mmPhone桥;
    输.placeholder = (桥 && 桥.私信生成中 && 桥.私信生成中()) ? '对方正在回复…' : '输入私信…（Enter 发送）';
  }
  function 发私信流程() {
    const 桥 = topWin.__mmPhone桥;
    const 输 = topDoc.getElementById('mmPhChatIn');
    if (!桥 || !当前聊天名) return;
    const 文 = (输 && 输.value ? 输.value : '').trim();
    if (!文) return;
    const 邀约 = /^「[^」]+」——/.test(文) ? 文.match(/^「([^」]+)」/)[1] : '';
    if (聊天发送中) return;
    聊天发送中 = true;
    const 发 = topDoc.getElementById('mmPhChatSend'); if (发) { 发.disabled = true; 发.textContent = '…'; }
    // 本地先显示玩家气泡（乐观渲染；落库由引擎写线程）
    const 线程盒 = topDoc.getElementById('mmPhThread');
    if (线程盒) {
      const 空 = 线程盒.querySelector('span'); if (空 && 空.textContent.includes('还没有对话')) 空.remove();
      const 泡 = topDoc.createElement('div');
      泡.className = 'mm-bub me ta-wait';
      泡.textContent = 文;
      线程盒.appendChild(泡);
      const sc = root.querySelector('#mmPhoneScreen'); if (sc) sc.scrollTop = sc.scrollHeight;
    }
    if (输) 输.value = '';
    Promise.resolve(桥.发私信(当前聊天名, 文, 邀约 || '')).then(r => {
      if (r && r.err) { try { topWin.toastr ? topWin.toastr.warning(r.err, '美漫 · 私信') : 0; } catch (_) { } }
    }).catch(e => console.warn(TAG, '发私信', e)).finally(() => {
      聊天发送中 = false;
      const 发2 = topDoc.getElementById('mmPhChatSend'); if (发2) { 发2.disabled = false; 发2.textContent = '发送'; }
      fill聊天(); // 实读真源重渲（含对方回复＋好感系统行）
    });
  }
  // Enter 发送（Shift+Enter 换行）
  topDoc.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || ev.shiftKey) return;
    const 输 = ev.target && ev.target.id === 'mmPhChatIn' ? ev.target : null;
    if (!输 || 当前app !== 'chat') return;
    ev.preventDefault();
    发私信流程();
  });
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
      // v0.2.3 修正：条目现在多是对象 {名称,描述,持续}——join 直接串成 [object Object]（真机实锤），改为智能取字段
      const 效果文 = e => {
        if (e && typeof e === 'object') {
          const 名 = e.名称 || e.名 || e.name || '';
          const 述 = e.描述 || e.效果 || e.desc || '';
          const 持 = e.持续 || e.期限 || '';
          return (名 ? 名 + '：' : '') + 述 + (持 ? '（持续：' + 持 + '）' : '');
        }
        return String(e);
      };
      const 效果原 = 玩.状态效果;
      const 效果卡字段 = e => {
        if (e && typeof e === 'object') return { 名: e.名称 || e.名 || e.name || '', 述: e.描述 || e.效果 || e.desc || '', 持: e.持续 || e.期限 || '' };
        const str = String(e || '');
        const m = str.match(/^([^：:｜]+)[：:｜](.+)$/);
        return { 名: m ? m[1] : '', 述: m ? m[2] : str, 持: '' };
      };
      const 色v = { 金: '#f8c830', 红: '#e62429', 青: '#58b7d4' };
      const 效果卡 = e => {
        const f = 效果卡字段(e);
        const 负 = /判定\s*-|-[\d]|伤害|流血|毒|衰|弱|惧|裂|痛|灼|冻|晕|哑|盲/.test((f.名 || '') + (f.述 || ''));
        const 正 = /\+[\d]|增益|强化|回复|恢复|加速/.test((f.名 || '') + (f.述 || ''));
        const c = 负 ? 色v.红 : (正 ? 色v.金 : 色v.青);
        return '<div style="position:relative;background:linear-gradient(165deg,rgba(19,26,44,.65),rgba(8,12,22,.75));box-shadow:inset 0 0 0 1px rgba(248,200,48,.14);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);padding:8px 10px 8px 15px;margin:5px 0">'
          + '<i style="position:absolute;left:0;top:0;bottom:0;width:3px;background:' + c + '"></i>'
          + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="color:#f4f6fa;font-size:12px">' + esc(f.名 || '状态') + '</b>'
          + (f.持 ? '<span style="margin-left:auto;font-size:10px;color:#ffd75e;background:rgba(248,200,48,.12);padding:1px 8px;white-space:nowrap">持续：' + esc(f.持) + '</span>' : '')
          + '</div>'
          + (f.述 ? '<div style="color:#9aa3b5;font-size:11px;line-height:1.5;margin-top:3px">' + esc(f.述) + '</div>' : '')
          + '</div>';
      };
      const 效果盒 = topDoc.getElementById('mmPh状态效果');
      if (效果盒) 效果盒.innerHTML = Array.isArray(效果原) ? (效果原.length ? 效果原.map(效果卡).join('') : '<span style="color:#6e6c68;font-size:11px">无</span>') : (效果原 ? 效果卡(效果原) : '<span style="color:#6e6c68;font-size:11px">无</span>');
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
      const 点色 = l => /判定|2d6|行动|命中|失败|成功|大成/.test(l) ? '#e62429' : (/世界反应/.test(l) ? '#58b7d4' : (/干预|成长|事件|抽取|脉/.test(l) ? '#f8c830' : '#79818f'));
      box.innerHTML = 日.length ? 日.map(l => '<div style="display:flex;align-items:flex-start;gap:7px;padding:6px 2px;border-bottom:1px solid rgba(255,255,255,.04)"><i style="flex:0 0 6px;width:6px;height:6px;border-radius:1px;margin-top:5px;background:' + 点色(l) + '"></i><span style="flex:1;color:#9aa3b5;font-size:11px;line-height:1.6">' + esc(l) + '</span></div>').join('') : '<span style="color:#a09a8a">（暂无记录）</span>';
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

  console.info(TAG, '手机面板 v0.2.3 就绪（争锋 UI＋词条卡＋聊天一期·五应用＋桌面组件·第二作用域架构）');
})();
