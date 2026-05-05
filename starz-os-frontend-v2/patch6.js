const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

const oldFn = "function maximizeWindow(windowId) {\r\n  const win = windows[windowId]\r\n  if (!win) return\r\n  if (win.maximized) {\r\n    const c = appConfigs[win.appId]\r\n    win.element.style.width=c.w+'px'; win.element.style.height=c.h+'px'; win.element.style.left='40px'; win.element.style.top='20px'\r\n    win.maximized=false\r\n  } else {\r\n    win.element.style.width='100%'; win.element.style.height='100%'; win.element.style.left='0'; win.element.style.top='0'\r\n    win.maximized=true\r\n  }\r\n}";

const newFn = "function maximizeWindow(windowId) {\r\n  const win = windows[windowId]\r\n  if (!win) return\r\n  if (win.maximized) {\r\n    const cfg = appConfigs[win.appId]\r\n    win.element.style.width=cfg.w+'px'; win.element.style.height=cfg.h+'px'; win.element.style.left=win._ox||'100px'; win.element.style.top=win._oy||'60px'\r\n    win.maximized=false\r\n  } else {\r\n    win._ox=win.element.style.left; win._oy=win.element.style.top\r\n    win.element.style.width='calc(100vw - 10px)'; win.element.style.height='calc(100vh - 80px)'; win.element.style.left='5px'; win.element.style.top='5px'\r\n    win.maximized=true\r\n  }\r\n}";

c = c.replace(oldFn, newFn);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed:', c.includes('calc(100vw - 10px)'));