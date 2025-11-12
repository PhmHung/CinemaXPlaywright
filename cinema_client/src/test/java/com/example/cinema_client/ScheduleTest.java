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

public class ScheduleTest extends StateContext {

    @Test
    void chucNang_ChonLichXemPhim() throws IOException {

        LogIn();

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
