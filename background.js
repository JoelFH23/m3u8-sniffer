/* eslint no-undef: "off" */
const regex = /(https?:\/\/[^\s]+\.m3u8(?:\?[^\s]*)?)/g
const dataList = []

function addToList (url, tabId) {
  const tabObj = dataList.find(item => item.tabId === tabId)
  if (tabObj) {
    if (tabObj.files.length >= 10) tabObj.files.length = 0
    tabObj.files.push(url)
  } else {
    dataList.push({
      tabId,
      files: [url]
    })
  }
  chrome.action.setBadgeText({ text: `${dataList.filter(item => item.tabId === tabId)[0].files.length}`, tabId })
  chrome.action.setBadgeBackgroundColor({ color: 'green', tabId })
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function ({ tabId }) {
    port.postMessage(dataList.filter(item => item.tabId === tabId))
  })
})

chrome.webRequest.onBeforeRequest.addListener(async function (details) {
  if (!details.url.match(regex)) return

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || tab.id !== details.tabId) return

  addToList(details.url, tab.id)
}, { urls: ['<all_urls>'] })
