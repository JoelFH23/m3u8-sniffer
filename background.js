/* eslint no-undef: "off" */
const m3u8UrlRegex = /(https?:\/\/[^\s]+\.m3u8(?:\?[^\s]*)?)/g
const capturedStreams = []

function addToList (streamUrl, tabId, streamType) {
  const existingTabData = capturedStreams.find(item => item.tabId === tabId)
  if (existingTabData) {
    if (existingTabData.files.length >= 10) existingTabData.files.length = 0
    existingTabData.files.push({ streamType, streamUrl })
  } else {
    capturedStreams.push({
      tabId,
      files: [{ streamType, streamUrl }]
    })
  }

  const currentTabData = capturedStreams.find(item => item.tabId === tabId)
  if (currentTabData) {
    chrome.action.setBadgeText({ text: `${currentTabData.files.length}`, tabId })
    chrome.action.setBadgeBackgroundColor({ color: 'green', tabId })
  }
}

chrome.runtime.onConnect.addListener(function (popupPort) {
  popupPort.onMessage.addListener(function ({ requestedTabId, action }) {
    if (action === 'get') {
      popupPort.postMessage(capturedStreams.filter(item => item.tabId === requestedTabId))
    } else if (action === 'clear') {
      const index = capturedStreams.findIndex(item => item.tabId === requestedTabId)
      if (index !== -1) capturedStreams[index].files = []
      chrome.action.setBadgeText({ text: '', tabId: requestedTabId })
    }
  })
})

chrome.webRequest.onBeforeRequest.addListener(async function (requestDetails) {
  if (!requestDetails.url.match(m3u8UrlRegex)) return

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab || activeTab.id !== requestDetails.tabId) return

  if (/^https:\/\/[^/]+\/api\/channel\/hls\/[^/]+\.m3u8(\?.*)?$/.test(requestDetails.url)) {
    addToList(requestDetails.url, activeTab.id, 'live')
  } else if (/^https:\/\/[^/]+\/vod\/\d+\.m3u8(\?.*)?$/.test(requestDetails.url)) {
    addToList(requestDetails.url, activeTab.id, 'vod')
  } else if (/^https:\/\/.+\/hls\/master\.m3u8(\?.*)?$/.test(requestDetails.url)) {
    addToList(requestDetails.url, activeTab.id, 'vod')
  } else if (/^https:\/\/[^/]+\/api\/video\/.+\.m3u8(\?.*)?$/.test(requestDetails.url)) {
    addToList(requestDetails.url, activeTab.id, 'live')
  }
}, { urls: ['<all_urls>'] })
