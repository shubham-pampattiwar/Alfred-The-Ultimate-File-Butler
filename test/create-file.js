const puppeteer = require('puppeteer')
const { expect } = require('chai')
const config = require('./utils/test_constants');

async function login(browser, url) {
	const page = await browser.newPage();

	await page.goto(url, { waitUntil: 'networkidle0' });

	// Login
	await page.type('input[id=loginId]', config.TEST_USER);
	await page.type('input[id=loginPassword]', config.TEST_PASSWORD);
	await page.click('button[id=loginButton]');

	// Wait for redirect
	await page.waitForNavigation();
	return page;
}

async function postMessage(page, msg) {
	// Waiting for page to load
	await page.waitForSelector('#post_textbox');

	// Focus on post textbox and press enter.
	await page.focus('#post_textbox')
	await page.keyboard.type(msg);
	await page.keyboard.press('Enter');
}

describe('Test file Create usecase', function () {
	var browser;
	var page;

	this.timeout(5000000);

	beforeEach(async () => {
		browser = await puppeteer.launch({
			headless: config.HEADLESS,
			slowMo: config.SLO_MO,
			args: ["--no-sandbox", "--disable-web-security"]
		});
		page = await login(browser, `${config.MM_URL}/login`);
	});

	afterEach(async () => {
		await page.waitFor(config.PROCESSING);
		await browser.close();
	});


	it('should create a file on drive', async () => {
		let filename = 'Resource.pdf';
		let msg = "@alfred create " + filename;
		await postMessage(page, msg);

		await page.waitFor(config.PROCESSING);
		await page.waitForSelector('button[aria-label="alfred"]');

		const botResponse = await page.evaluate(() => {
			// fetches latest response from the bot
			return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
		});

		expect(botResponse).to.contain("Created file");
	});

	it('should validate file extension', async () => {
		let filename = '.';
		let msg = "@alfred create " + filename;
		await postMessage(page, msg);

		await page.waitFor(config.PROCESSING);
		await page.waitForSelector('button[aria-label="alfred"]');

		const botResponse = await page.evaluate(() => {
			// fetches latest response from the bot
			return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
		});

		expect(botResponse).to.contain("Please Enter a valid file name");
	});

	it('should validate file name', async () => {
		let filename = 'Resource.exe';
		let msg = "@alfred create " + filename;
		await postMessage(page, msg);

		await page.waitFor(config.PROCESSING);
		await page.waitForSelector('button[aria-label="alfred"]');

		const botResponse = await page.evaluate(() => {
			// fetches latest response from the bot
			return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
		});

		expect(botResponse).to.contain("Please enter a supported file extension.");
	});

});