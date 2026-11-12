# -*- coding: utf-8 -*-
# 一次性：删 phone_panel.js 九个页内冗余 apphead 行（标题已上移共享导航栏）
import io, re
p = r'E:\zcode项目\美漫大世界\remote\dist\phone_panel.js'
s = io.open(p, encoding='utf-8').read()
pat = re.compile(r"\s*'    <div class=\"mm-apphead\"><span class=\"at\">.*?</span></div>',")
n = len(pat.findall(s))
s2 = pat.sub('', s)
io.open(p, 'w', encoding='utf-8', newline='').write(s2)
print('removed:', n, '| remaining mm-apphead refs:', s2.count('mm-apphead'))
