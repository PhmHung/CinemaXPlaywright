package com.example.cinema_client;

import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.SelectOption;
import com.microsoft.playwright.options.WaitForSelectorState;
import org.junit.jupiter.api.Test;

import com.microsoft.playwright.*;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ScheduleTest extends TestContext {

    Path AUTH_FILE = Paths.get(System.getProperty("user.home"),
            "Downloads","cinema_client","src","test","java","com","example","cinema_client","state.json");

    public void LogInState() throws IOException {
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

    @Test
    void chucNang_ChonLichXemPhim() throws IOException {

        LogInState();

        context = browser.newContext(new Browser.NewContextOptions().setStorageStatePath(AUTH_FILE));
        page = context.newPage();

        page.navigate("http://localhost:8081/schedule?movieId=7&branchId=1");

        // CHỌN NGÀY XEM — theo value
        page.selectOption("#listDate", new SelectOption().setValue("2021-01-08"));
        assertThat(page.locator("#listDate")).hasValue("2021-01-08");

        // CHỌN GIỜ XEM
        page.selectOption("#listTimes", new SelectOption().setValue("14:05"));
        assertThat(page.locator("#listTimes")).hasValue("14:05");

        // SUBMIT
        Locator submit = page.locator("input[type=\"submit\"].btn-outline-danger");
        assertThat(submit).isVisible();

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> submit.click());

        // Xác nhận URL đích
        assertThat(page).hasURL("http://localhost:8081/room-selection");

        // in kết quả
        System.out.println("✅ Chức năng chọn lịch xem phim hoạt động tốt!");
    }
}
