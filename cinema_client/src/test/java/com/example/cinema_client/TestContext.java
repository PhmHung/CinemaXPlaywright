package com.example.cinema_client;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.*;

import java.util.concurrent.TimeUnit;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class TestContext {
    //Initial Variables for Testing

    static Playwright playwright;
    static Browser browser;

    BrowserContext context;
    Page page;

    //Start before all tests
    @BeforeAll
    static void launchBrowser() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(

                new BrowserType.LaunchOptions().setHeadless(false)
        );
    }

    //Run after all tests
    @AfterAll
    static void closeBrowser() {
        playwright.close();
    }

    //Run before each test
    @BeforeEach
    void createContextAndPage() {
        context = browser.newContext();
        page = context.newPage();
    }

    //Run after each test
    @AfterEach
    void closeContext() {
        context.close();
    }
}
