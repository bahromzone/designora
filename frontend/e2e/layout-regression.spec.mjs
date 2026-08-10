import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

const ONBOARDING_KEY = "designora-onboarded";

// Nega bu fayl bor: onboarding footer'i #234 dan #241 gacha 8 ta PR oldi,
// profil menyusi pozitsiyasi #246-#248 da yana 3 ta. Ikkalasi ham bir xil
// sinf xato: element DOM'da bor va testlar uni topadi, lekin u viewport yoki
// o'z konteyneri chegarasidan tashqarida turadi. Funksional E2E bunday
// xatoni ko'rmaydi.
//
// Piksel snapshot bu yerda ataylab ishlatilmaydi: runner'da shrift renderi va
// antialiasing o'zgaradi, natijada gate flaky bo'lib ishonchini yo'qotadi.
// O'rniga geometriya invariantlari qulflanadi: nima ko'rinishi SHART, qayerda
// turishi shart va nimaning ustida turmasligi shart.

test.use({ reducedMotion: "reduce" });

const VIEWPORTS = {
  // Past balandlik brauzer zoom'ini taqlid qiladi: #237 aynan shu holatda
  // sinardi, chunki footer overflow chegarasidan pastga chiqib ketardi.
  "1920x1080": { width: 1920, height: 1080 },
  "1440x900": { width: 1440, height: 900 },
  "1280x600": { width: 1280, height: 600 },
  "390x844": { width: 390, height: 844 },
};

// Navbar auth bloki `hidden md:flex` bo'lgani uchun faqat >= 768px da mavjud.
const NAVBAR_VIEWPORTS = {
  "1920x1080": { width: 1920, height: 1080 },
  "1440x900": { width: 1440, height: 900 },
  "1024x640": { width: 1024, height: 640 },
};

const ONBOARDING_STEPS = [
  {
    title: /Design sizni qayerga olib borishi kerak/,
    choice: /Ishga tayyorlanish/,
    advance: /Keyingi/,
  },
  {
    title: /Qaysi yo.nalishlar sizniki/,
    choice: /UI\/UX dizayn/,
    advance: /Keyingi/,
  },
  {
    title: /Hozir qaysi bosqichdasiz/,
    choice: /Yangi boshlayapman/,
    advance: /Keyingi/,
  },
  {
    title: /Real tempni tanlaymiz/,
    choice: /4\s*soat/,
    advance: /Rejani yaratish/,
  },
];

test.beforeEach(() => {
  test.skip(
    !email || !password,
    "Set E2E_EMAIL and E2E_PASSWORD for a real environment.",
  );
});

async function expectFullyVisible(locator, label) {
  await expect(locator, `${label}: ko'rinmadi`).toBeVisible({
    timeout: 20_000,
  });
  // ratio 1 = element viewport ichida TO'LIQ. Aynan shu tekshiruv yo'qligi
  // uchun footer bug'i sakkiz marta qaytgan.
  await expect(locator, `${label}: viewport ichida to'liq emas`).toBeInViewport({
    ratio: 1,
    timeout: 20_000,
  });
}

async function boxOf(locator, label) {
  const value = await locator.boundingBox();
  expect(value, `${label}: boundingBox topilmadi`).not.toBeNull();
  return value;
}

function centerY(box) {
  return box.y + box.height / 2;
}

// framer-motion header'ni `y: -100` dan `0` ga JS bilan suradi va bunga
// prefers-reduced-motion ta'sir qilmaydi. Animatsiya tugashini kutmasak,
// o'lchov tasodifiy oraliq qiymatni oladi va gate flaky bo'ladi.
async function waitForHeaderToSettle(page) {
  await page.waitForFunction(() => {
    const header = document.querySelector("header");
    if (!header) return false;
    const transform = window.getComputedStyle(header).transform;
    return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
  });
}

async function signIn(page, { suppressOnboarding }) {
  if (suppressOnboarding) {
    await page.addInitScript((key) => {
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        /* private mode */
      }
    }, ONBOARDING_KEY);
  }

  await page.goto("/?modal=login");
  await page.getByPlaceholder("E-pochta").fill(email);
  await page.getByPlaceholder("Parol").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "KIRISH", exact: true }).click();
  const loginResponse = await loginResponsePromise;
  const loginBody = await loginResponse
    .text()
    .catch(() => "<body unavailable after navigation>");

  expect(
    loginResponse.ok(),
    `Login failed with ${loginResponse.status()}: ${loginBody}`,
  ).toBeTruthy();
  await expect(page).toHaveURL(/\/kurslarim/, { timeout: 20_000 });
}

for (const [label, viewport] of Object.entries(VIEWPORTS)) {
  test(`onboarding navigation stays inside the modal at ${label}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    // Bu testda onboarding ATAYLAB bosilmaydi: tekshirilayotgan narsa aynan
    // shu modalning layout'i.
    await signIn(page, { suppressOnboarding: false });

    const modal = page.locator(".onboarding-layer");
    const shell = page.locator(".onboarding-shell");
    await expect(modal).toBeVisible({ timeout: 20_000 });

    for (const [index, step] of ONBOARDING_STEPS.entries()) {
      const position = `${index + 1}/${ONBOARDING_STEPS.length}-qadam`;

      await expect(
        modal.getByRole("heading", { level: 1, name: step.title }),
        `${position}: sarlavha ko'rinmadi`,
      ).toBeVisible({ timeout: 20_000 });

      const shellBox = await boxOf(shell, `${position} modal`);
      expect(
        shellBox.height,
        `${position}: modal viewport balandligidan oshib ketdi`,
      ).toBeLessThanOrEqual(viewport.height + 1);
      expect(
        shellBox.width,
        `${position}: modal viewport kengligidan oshib ketdi`,
      ).toBeLessThanOrEqual(viewport.width + 1);

      const back = modal.getByRole("button", { name: /Oldingi/ });
      const advance = modal.getByRole("button", { name: step.advance });

      await expectFullyVisible(back, `${position} "Oldingi"`);
      await expectFullyVisible(advance, `${position} navigatsiya tugmasi`);

      const footerBox = await boxOf(
        modal.locator(".onboarding-actions"),
        `${position} footer`,
      );
      expect(
        footerBox.y + footerBox.height,
        `${position}: footer modal chegarasidan chiqib ketdi`,
      ).toBeLessThanOrEqual(shellBox.y + shellBox.height + 1);
      expect(
        footerBox.x + footerBox.width,
        `${position}: footer modaldan o'ngga chiqib ketdi`,
      ).toBeLessThanOrEqual(shellBox.x + shellBox.width + 1);

      await modal.getByRole("button", { name: step.choice }).click();
      await expect(
        advance,
        `${position}: tanlovdan keyin ham tugma disabled`,
      ).toBeEnabled();
      // trial click hit-target'ni tekshiradi: tugma ustini boshqa element
      // to'sib qo'ysa, bu qatorda yiqiladi.
      await advance.click({ trial: true });
      await advance.click();
    }

    await expect(modal, "oxirgi qadamdan keyin modal yopilmadi").toHaveCount(
      0,
      { timeout: 10_000 },
    );
  });
}

for (const [label, viewport] of Object.entries(NAVBAR_VIEWPORTS)) {
  test(`account menu shares the navbar row at ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signIn(page, { suppressOnboarding: true });
    await expect(page.locator(".onboarding-layer")).toHaveCount(0);
    await waitForHeaderToSettle(page);

    const header = page.locator("header").first();
    const bell = page.getByRole("button", { name: "Bildirishnomalar" });
    const avatar = page.getByRole("button", { name: "Foydalanuvchi menyusi" });
    const signOut = page.getByRole("button", { name: "Chiqish", exact: true });

    await expectFullyVisible(bell, "bildirishnoma tugmasi");
    await expectFullyVisible(avatar, "profil avatari");
    await expectFullyVisible(signOut, "Chiqish tugmasi");

    const headerBox = await boxOf(header, "navbar");
    const bellBox = await boxOf(bell, "bildirishnoma tugmasi");
    const avatarBox = await boxOf(avatar, "profil avatari");
    const signOutBox = await boxOf(signOut, "Chiqish tugmasi");

    // #246-#248 ning aslida qulflanishi kerak bo'lgan sharti.
    expect(
      Math.abs(centerY(avatarBox) - centerY(signOutBox)),
      "avatar va Chiqish bir qatorda emas",
    ).toBeLessThanOrEqual(4);
    expect(
      Math.abs(centerY(avatarBox) - centerY(bellBox)),
      "avatar va bildirishnoma tugmasi bir qatorda emas",
    ).toBeLessThanOrEqual(4);
    expect(
      bellBox.x,
      "bildirishnoma tugmasi avatardan chapda bo'lishi kerak",
    ).toBeLessThan(avatarBox.x);
    expect(
      avatarBox.x,
      "avatar Chiqish tugmasidan chapda bo'lishi kerak",
    ).toBeLessThan(signOutBox.x);

    // Avatar navbar oqimida bo'lishi kerak, alohida fixed qatlamda emas.
    expect(
      avatarBox.y,
      "avatar navbar tepasidan yuqorida",
    ).toBeGreaterThanOrEqual(headerBox.y - 1);
    expect(
      avatarBox.y + avatarBox.height,
      "avatar navbar pastidan tashqarida",
    ).toBeLessThanOrEqual(headerBox.y + headerBox.height + 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, "sahifa gorizontal scroll berdi").toBeLessThanOrEqual(1);

    // Dropdown o'ng chegaradan qirqilmasin: eski `fixed right-[8.5rem]`
    // sehrli offseti aynan shu xatoni beradi.
    await avatar.click();
    const menu = page.getByRole("menu");
    await expectFullyVisible(menu, "profil dropdown");
    const menuBox = await boxOf(menu, "profil dropdown");
    expect(menuBox.x, "dropdown chap chegaradan chiqdi").toBeGreaterThanOrEqual(
      -1,
    );
    expect(
      menuBox.x + menuBox.width,
      "dropdown o'ng chegaradan chiqdi",
    ).toBeLessThanOrEqual(viewport.width + 1);

    await page.keyboard.press("Escape");
    await expect(menu, "Escape dropdownni yopmadi").toHaveCount(0);
  });
}
