// ==UserScript==
// @name         原神祈愿分析链接获取
// @namespace    Z2Vuc2hpbi1nYWNoYS11cmw=
// @version      0.2
// @description  try to take over the world!
// @author       You
// @run-at       document-start
// @match        https://user.mihoyo.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function getDs() {
    let salt = 'ulInCDohgEs557j0VsPDYnQaaz6KJcv5'
    let time = parseInt(Date.now() / 1000)
    let str = getStr()
    let md5 = window.md5(`salt=${salt}&t=${time}&r=${str}`)
    return `${time},${str},${md5}`
  }

  function getStr() {
    let chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
    let maxPos = chars.length
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[parseInt(Math.floor(Math.random() * maxPos))]
    }
    return code
  }

  function setCookie(list) {
    return Promise.all(list.map(item => {
      return window.cookieStore.set({
        name: item.name,
        value: item.token,
        domain: 'mihoyo.com',
        sameSite: 'none'
      })
    }))
  }

  function injectHtml(nickname, url) {
    let template = `
      <div class="sub-title">
        <span>抽卡链接-${nickname}</span>
      </div>
      <ul class="info-content">
        <li>
          <span style="word-break: break-all; white-space: pre-wrap;">${url}</span>
        </li>
      </ul>
    `
    let div = document.createElement('div')
    div.innerHTML = template
    document.querySelector('.mhy-account-main-page.mhy-container-content').appendChild(div)
  }

  function showGachaUrl(server) {
    window.cookieStore.get('_MHYUUID').then(item => {
      fetch('https://api-takumi.mihoyo.com/binding/api/genAuthKey', {
        credentials: 'include',
        method: 'post',
        mode: 'cors',
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json;charset=utf-8",
          "Host": "api-takumi.mihoyo.com",
          "x-rpc-client_type": "5",
          "x-rpc-app_version": "2.28.1",
          "x-rpc-device_id": item.value,
          "DS": getDs()
        },
        body: JSON.stringify({
          auth_appid: 'webview_gacha',
          game_uid: server.game_uid,
          game_biz: server.game_biz,
          region: server.region
        })
      }).then(res => res.json()).then(res => {
        let url = `https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?win_mode=fullscreen&authkey_ver=1&sign_type=2&auth_appid=webview_gacha&init_type=301&gacha_id=b4ac24d133739b7b1d55173f30ccf980e0b73fc1&lang=zh-cn&device_type=mobile&game_version=CNRELiOS3.0.0_R10283122_S10446836_D10316937&plat_type=ios&game_biz=${server.game_biz}&size=20&authkey=${encodeURIComponent(res.data.authkey)}<span>&</span>region=${server.region}<span>&</span>timestamp=1664481732&gacha_type=200&page=1&end_id=0`
        injectHtml(server.nickname, url)
      })
    })
  }

  function getGachaUrl() {
    let uid = ''
    let token = ''
    fetch(`https://webapi.account.mihoyo.com/Api/login_by_cookie?t=${Date.now()}`, {
      credentials: 'include'
    }).then(res => res.json()).then(res => {
      uid = res.data.account_info.account_id
      token = res.data.account_info.weblogin_token
      return fetch(`https://api-takumi.mihoyo.com/auth/api/getMultiTokenByLoginTicket?login_ticket=${token}&token_types=3&uid=${uid}`, {
        credentials: 'include'
      })
    }).then(res => res.json()).then(res => {
      return window.cookieStore.set({
        name: 'stuid',
        value: uid,
        domain: 'mihoyo.com'
      }).then(() => {
        return setCookie(res.data.list, 0)
      }).then(() => {
        return fetch('https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=hk4e_cn', {
          credentials: 'include'
        })
      })
    }).then(res => res.json()).then(res => {
      res.data.list.forEach(server => {
        showGachaUrl(server)
      })
    })
  }

  if (!window.md5) {
    let script = document.createElement('script')
    script.src = 'https://cdn.bootcdn.net/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js'
    document.head.appendChild(script)
  }
  
  let timer = setInterval(function () {
    let app = document.querySelector('#root').__vue__
    if (app) {
      app.$children.forEach(item => {
        if (item.$el._prevClass === 'home') {
          getGachaUrl()
          window.clearInterval(timer)
        }
      })
    }
  }, 2000)
})()
