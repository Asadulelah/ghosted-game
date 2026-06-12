from playwright.sync_api import sync_playwright
import time

url = 'file:///C:/Users/FoxOS_User/Developer/ghosted-game/index.html?seed=42'
out = r'C:/Users/FoxOS_User/Developer/ghosted-game/'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1480, 'height': 920}, device_scale_factor=1.5)
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_selector('#startBtn', timeout=20000)
    time.sleep(1)
    pg.screenshot(path=out + 'shot-1-intro.png')
    pg.click('#startBtn')
    time.sleep(0.6)

    def maybe_close_modals():
        if pg.is_visible('#dcModal.on'):
            pg.click('#dcYes'); time.sleep(0.3)
        if pg.is_visible('#voiceModal.on'):
            pg.click('#vRest'); time.sleep(0.3)

    # play ~12 days with a sensible policy
    for day in range(12):
        for _ in range(6):  # attempt actions until energy runs dry
            maybe_close_modals()
            if pg.evaluate('() => G.over ? 0 : G.energy') < 1:
                break
            hot = pg.query_selector('.pbtn.hot')
            if hot:
                hot.click(); time.sleep(0.35); maybe_close_modals(); continue
            if day % 3 == 2:
                pg.click("[data-act='rest']"); time.sleep(0.4); maybe_close_modals()
            elif day % 2 == 0:
                pg.click("[data-act='outreach']"); time.sleep(0.25)
            else:
                pg.click("[data-act='content']"); time.sleep(0.25)
        maybe_close_modals()
        if day == 5:
            pg.screenshot(path=out + 'shot-2-midgame.png')
        if pg.is_visible('#endModal.on') or pg.evaluate('() => G.over'):
            print('game ended naturally on day', pg.evaluate('() => G.day'))
            break
        pg.click('#endDay'); time.sleep(0.35)

    state = pg.evaluate('() => ({day: G.day, cash: G.cash, rep: G.rep, burnout: G.burnout, steel: G.steel, won: G.won, ghosted: G.ghosted, prospects: G.prospects.length, over: G.over})')
    lines = pg.eval_on_selector_all('#log .line', 'els => els.length')
    print('STATE after play:', state)
    print('log lines:', lines)
    pg.screenshot(path=out + 'shot-3-late.png')

    # reach the end screen (force only if the playthrough didn't get there)
    if not pg.is_visible('#endModal.on'):
        pg.evaluate('() => { G.cash = 10500; }')
        pg.click('#endDay'); time.sleep(0.8)
    print('end modal visible:', pg.is_visible('#endModal.on'), '| title:', pg.inner_text('#endTitle'))
    pg.screenshot(path=out + 'shot-4-win.png')
    with pg.expect_download() as dl:
        pg.click('#shareEnd')
    dl.value.save_as(out + 'run-card-sample.png')
    print('share card ok')
    print('desktop errors:', errs if errs else 'none')

    # mobile pass
    m = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True)
    merr = []
    m.on('pageerror', lambda e: merr.append(str(e)))
    m.goto(url)
    m.wait_for_selector('#startBtn', timeout=20000)
    m.click('#startBtn')
    time.sleep(0.6)
    for _ in range(3):
        if m.evaluate('() => G.energy') < 1:
            break
        m.click("[data-act='outreach']"); time.sleep(0.3)
        if m.is_visible('#dcModal.on'): m.click('#dcYes')
    m.click('#endDay'); time.sleep(0.5)
    m.screenshot(path=out + 'shot-5-mobile.png')
    print('mobile day:', m.inner_text('#stDay'), '| mobile errors:', merr if merr else 'none')
    b.close()
print('OK')
