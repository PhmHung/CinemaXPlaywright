package com.example.cinema_client;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.*;
import org.junit.jupiter.api.*;

import java.io.IOException;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class SeatSelectionTest extends StateContext {

    @Test
    @DisplayName("Chức năng: chọn ghế ngồi")
    void chonGheNgoi() throws IOException {

        LogIn();

        String url = "http://localhost:8081/seat-selection?movieId=7&branchId=1&startDate=2021-01-05&startTime=10:15&roomId=1";
        page.navigate(url);

        // CHỌN GHẾ (DANH SÁCH GHẾ ARRAY)
        String[] seatsToSelect = {"2", "3"};
        for (String seat : seatsToSelect) {
            Locator seatLocation = page.locator("input[name='seats'][value='" + seat + "']");
            seatLocation.check();
            assertThat(seatLocation).isChecked();
        }

        // SUBMIT
        Locator submit = page.locator("input[type='submit'].btn-outline-danger");
        assertThat(submit).isVisible();

        // Bấm và CHỜ điều hướng tới /bill
//        page.waitForURL("http://localhost:8081/bill", () -> submit.click());
//        assertThat(page).hasURL("http://localhost:8081/bill");

        // Bấm và CHỜ điều hướng tới /bill
        submit.click();
        page.waitForLoadState(LoadState.NETWORKIDLE);
        assertThat(page).hasURL("http://localhost:8081/bill");

        // Click thanh toán
        Locator payButton = page.locator("a.btn.btn-outline-danger.btn-block");
        assertThat(payButton).isVisible();

        // Bấm và CHỜ điều hướng tới lịch sử vé
//        page.waitForURL("http://localhost:8081/tickets/history", () -> payButton.click());
//        assertThat(page).hasURL("http://localhost:8081/tickets/history");

        // Bấm và CHỜ điều hướng tới lịch sử vé
        payButton.click();
        page.waitForLoadState(LoadState.NETWORKIDLE);
        assertThat(page).hasURL("http://localhost:8081/tickets/history");
    }
}
