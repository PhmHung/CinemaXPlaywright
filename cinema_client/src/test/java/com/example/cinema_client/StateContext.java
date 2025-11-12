package com.example.cinema_client;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitForSelectorState;
import lombok.SneakyThrows;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


public class StateContext extends TestContext {

    Path AUTH_FILE = Paths.get(System.getProperty("user.home"),
            "Downloads","cinema_client","src","test","java","com","example","cinema_client","state.json");

    private void LogInState() throws IOException {
        Files.createDirectories(AUTH_FILE.getParent());

        String USERNAME = System.getenv().getOrDefault("PW_USERNAME", "hait5169@gmail.com");
        String PASSWORD = System.getenv().getOrDefault("PW_PASSWORD", "123456");

        Playwright pw = null;
        Browser browser = null;
        BrowserContext ctx = null;

        try {
            pw = Playwright.create();
            browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
            ctx = browser.newContext(); // context trống
            Page page = ctx.newPage();

            // timeout cơ bản
            page.setDefaultTimeout(15000);
            page.setDefaultNavigationTimeout(30000);

            // 1) Mở trang
            page.navigate("http://localhost:8081/");

            // 2) Mở modal đăng nhập
            page.locator("a[data-target=\"#modalLoginForm\"]").click();
            Locator modal = page.locator("#modalLoginForm");
            modal.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));

            // 3) Điền form bằng selector chắc cú theo name
            modal.locator("input[name='username']").fill(USERNAME);
            modal.locator("input[name='password']").fill(PASSWORD);

            // 4) Click submit và BẮT response POST /account/login (đúng chữ ký Java)
            page.waitForResponse(
                    r -> r.url().contains("/account/login") && "POST".equals(r.request().method()),
                    () -> modal.locator("button[type='submit']").click()
            );

            // 5) Fallback: nếu app điều hướng/SPA, chờ mạng rảnh
            try {
                page.waitForLoadState(LoadState.NETWORKIDLE);
            } catch (PlaywrightException ignored) {}

            // 6) Kiểm tra dấu hiệu đã login (tuỳ app bạn)
            boolean loggedIn =
                    page.locator("text=Đăng xuất").isVisible() ||
                            page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng xuất")).isVisible(new Locator.IsVisibleOptions().setTimeout(1000));

            if (!loggedIn) {
                System.out.println("⚠️  Chưa thấy dấu hiệu 'Đăng xuất'. Vẫn lưu state, nhưng có thể phiên chưa hợp lệ.");
            }

            // 7) Lưu STORAGE STATE
            ctx.storageState(new BrowserContext.StorageStateOptions().setPath(AUTH_FILE));
            System.out.println("✅ Đã lưu trạng thái đăng nhập: " + AUTH_FILE.toAbsolutePath());

        } finally {
            // Đóng tài nguyên an toàn
            if (ctx != null) try { ctx.close(); } catch (Exception ignored) {}
            if (browser != null) try { browser.close(); } catch (Exception ignored) {}
            if (pw != null) try { pw.close(); } catch (Exception ignored) {}
        }
    }

    void LogIn() throws IOException {
        LogInState();

        context = browser.newContext(new Browser.NewContextOptions().setStorageStatePath(AUTH_FILE));
        page = context.newPage();
    }

}
