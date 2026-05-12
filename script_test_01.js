(function () {

  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: #f0f4ff;
        box-sizing: border-box;
      }
    </style>
    <div style="padding:16px;font-size:16px;color:#333;">
      ✅ Web Component 로드 성공 (Shadow DOM)
    </div>
  `

  class Main extends HTMLElement {
    constructor () {
      super()
      this._root = this.attachShadow({ mode: 'open' })
      this._root.appendChild(template.content.cloneNode(true))
      console.log('[HierarchyWidget] constructor called')
    }

    connectedCallback () {
      console.log('[HierarchyWidget] connectedCallback called')

      // Shadow DOM 안에 추가 메시지
      const p = document.createElement('p')
      p.style.cssText = 'padding:8px 16px;color:green;font-size:14px;'
      p.textContent = '✅ connectedCallback 실행됨 — Light DOM 테스트 중...'
      this._root.appendChild(p)

      // Light DOM에도 붙여보기
      const light = document.createElement('div')
      light.style.cssText = 'padding:8px 16px;color:blue;font-size:14px;'
      light.textContent = '✅ Light DOM appendChild 성공'
      this.appendChild(light)
    }

    onCustomWidgetResize (w, h) {
      console.log('[HierarchyWidget] resize', w, h)
    }
    onCustomWidgetAfterUpdate (p) {
      console.log('[HierarchyWidget] afterUpdate', p)
    }
    onCustomWidgetDestroy () {
      console.log('[HierarchyWidget] destroy')
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
  console.log('[HierarchyWidget] customElements.define 완료')

})()