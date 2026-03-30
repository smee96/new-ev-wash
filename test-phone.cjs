const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded', timeout: 10000 });

  const input = page.locator('#phone');
  const count = await input.count();
  if (!count) { console.log('phone input not found'); await browser.close(); return; }

  let pass = 0, fail = 0;

  async function check(desc, expected) {
    await page.waitForTimeout(120);
    const val = await input.inputValue();
    const ok = val === expected;
    console.log((ok ? 'PASS' : 'FAIL') + ' ' + desc + ': got=' + JSON.stringify(val) + ' want=' + JSON.stringify(expected));
    ok ? pass++ : fail++;
  }

  // 테스트 1: 숫자만 연속 입력
  await input.fill('');
  await input.type('01012345678', { delay: 40 });
  await check('숫자 연속입력', '010-1234-5678');

  // 테스트 2: 짧게
  await input.fill('');
  await input.type('010', { delay: 40 });
  await check('3자리', '010');

  // 테스트 3: 하이픈 직접 입력 시도
  await input.fill('');
  await input.type('010-1234-5678', { delay: 40 });
  await check('하이픈 포함 입력', '010-1234-5678');

  // 테스트 4: 하이픈 중복
  await input.fill('010');
  await input.type('----8774', { delay: 40 });
  await check('하이픈 중복', '010-8774');

  // 테스트 5: 붙여넣기(programmatic)
  await input.fill('');
  await page.evaluate(() => {
    const inp = document.getElementById('phone');
    inp.value = '01098765432';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await check('붙여넣기 시뮬', '010-9876-5432');

  // 테스트 6: 재처리 멱등성
  await page.evaluate(() => {
    const inp = document.getElementById('phone');
    inp.value = '010-1234-5678';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await check('멱등성(이미 포맷된 값)', '010-1234-5678');

  console.log('\nJS 오류: ' + (errors.length > 0 ? errors.join(', ') : '없음'));
  console.log('결과: ' + pass + '/' + (pass + fail) + ' 통과');
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
