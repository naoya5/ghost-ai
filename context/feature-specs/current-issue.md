クラックログアウトボタンをクリックすると、エラーが出ます。：

[browser] Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Failed to fetch
    at new Promise (<anonymous>)
    at navigate (https://top-bison-31.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:18:188900)
    at L (https://top-bison-31.clerk.accounts.dev/npm/@clerk/ui@1.7.0/dist/ui-common_ui_ad69ce_1.7.0.js:14:208005)
    at navigate (https://top-bison-31.clerk.accounts.dev/npm/@clerk/ui@1.7.0/dist/ui-common_ui_ad69ce_1.7.0.js:14:210024)
    at navigateAfterSignOut (https://top-bison-31.clerk.accounts.dev/npm/@clerk/ui@1.7.0/dist/746_ui_ad69ce_1.7.0.js:1:9309)
    at <unknown> (https://top-bison-31.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:18:168503)
    at Object.track (https://top-bison-31.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:16:12664)
    at o (https://top-bison-31.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:18:168479)
    at signOut (https://top-bison-31.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:18:168762)
    at async _ (https://top-bison-31.clerk.accounts.dev/npm/@clerk/ui@1.7.0/dist/ui-common_ui_ad69ce_1.7.0.js:5:68145)
