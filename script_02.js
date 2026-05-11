(function () {

  // ─── 샘플 데이터 ───────────────────────────────────────────
  const TREE_DATA = [
    {
      id: 'AS', text: '아시아',
      children: [
        {
          id: 'AS_KR', text: '대한민국',
          children: [
            { id: 'AS_KR_SEL', text: '서울',  children: [] },
            { id: 'AS_KR_PUS', text: '부산',  children: [] }
          ]
        },
        {
          id: 'AS_JP', text: '일본',
          children: [
            { id: 'AS_JP_TYO', text: '도쿄',   children: [] },
            { id: 'AS_JP_OSA', text: '오사카',  children: [] }
          ]
        }
      ]
    },
    {
      id: 'EU', text: '유럽',
      children: [
        {
          id: 'EU_DE', text: '독일',
          children: [
            { id: 'EU_DE_BER', text: '베를린', children: [] },
            { id: 'EU_DE_MUC', text: '뮌헨',   children: [] }
          ]
        }
      ]
    },
    {
      id: 'AM', text: '아메리카',
      children: [
        {
          id: 'AM_US', text: '미국',
          children: [
            { id: 'AM_US_NYC', text: '뉴욕',    children: [] },
            { id: 'AM_US_LAX', text: '로스앤젤레스', children: [] }
          ]
        }
      ]
    }
  ]

  // ─── Shadow DOM 없이 단순 template ────────────────────────
  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      :host { display: block; width: 100%; height: 100%; }
    </style>
    <div id="root" style="width:100%;height:100%;font-family:Arial,sans-serif;">
      <p style="color:#888;padding:8px;">UI5 로딩 중...</p>
    </div>
  `

  // ─── UI5 모듈 로드 ────────────────────────────────────────
  const UI5_MODULES = [
    'sap/m/Tree',
    'sap/m/StandardTreeItem',
    'sap/ui/model/json/JSONModel',
    'sap/m/Toolbar',
    'sap/m/Title',
    'sap/m/ToolbarSpacer',
    'sap/m/Button',
    'sap/m/SearchField',
    'sap/m/VBox'
  ]

  function requireModules (cb) {
    console.log('[Widget] sap.ui.require 시작')
    sap.ui.require(UI5_MODULES, function (
      Tree, StandardTreeItem, JSONModel,
      Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox
    ) {
      console.log('[Widget] UI5 모듈 로드 완료')
      cb(Tree, StandardTreeItem, JSONModel, Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox)
    })
  }

  function waitForSAP (cb) {
    if (window.sap && window.sap.ui && window.sap.ui.require) {
      console.log('[Widget] SAP 이미 로드됨')
      requireModules(cb)
      return
    }
    console.log('[Widget] SAP 없음 → CDN 로드 시도')
    if (!document.getElementById('sap-ui-bootstrap')) {
      const s = document.createElement('script')
      s.id = 'sap-ui-bootstrap'
      s.src = 'https://ui5.sap.com/1.120.1/resources/sap-ui-core.js'
      s.setAttribute('data-sap-ui-theme', 'sap_horizon')
      s.setAttribute('data-sap-ui-libs', 'sap.m')
      s.setAttribute('data-sap-ui-compatVersion', 'edge')
      s.setAttribute('data-sap-ui-async', 'false')
      s.onload = function () {
        console.log('[Widget] CDN 스크립트 로드됨, Core init 대기')
        sap.ui.getCore().attachInit(function () {
          console.log('[Widget] Core init 완료')
          requireModules(cb)
        })
      }
      s.onerror = function () {
        console.error('[Widget] UI5 CDN 로드 실패!')
      }
      document.head.appendChild(s)
    }
  }

  // ─── 트리 빌드 ────────────────────────────────────────────
  function buildTree (container, instance, Tree, StandardTreeItem, JSONModel, Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox) {
    console.log('[Widget] buildTree 시작, container:', container)

    container.innerHTML = '' // 로딩 메시지 제거

    const oModel = new JSONModel({ nodes: TREE_DATA })

    const oTree = new Tree({
      mode: 'SingleSelectMaster',
      includeItemInSelection: true,
      width: '100%',
      selectionChange: function (oEvent) {
        const oItem = oEvent.getParameter('listItem')
        if (!oItem) return
        const oCtx  = oItem.getBindingContext()
        const oData = oCtx ? oCtx.getObject() : null
        if (oData) {
          const path  = oCtx.getPath()
          const level = (path.match(/\/children\//g) || []).length + 1
          console.log('[Widget] 선택:', oData.text, '레벨:', level)
          instance.dispatchEvent(new CustomEvent('onNodeSelect', {
            detail: { id: oData.id, text: oData.text, level },
            bubbles: true, composed: true
          }))
        }
      }
    })

    oTree.bindItems({
      path: '/nodes',
      template: new StandardTreeItem({ title: '{text}' }),
      parameters: { arrayNames: ['children'] }
    })
    oTree.setModel(oModel)

    const oToolbar = new Toolbar({
      content: [
        new Title({ text: '지역 계층 (3레벨)' }),
        new ToolbarSpacer(),
        new Button({
          icon: 'sap-icon://expand-group',
          tooltip: '모두 펼치기',
          press: function () { oTree.expandToLevel(2) }
        }),
        new Button({
          icon: 'sap-icon://collapse-group',
          tooltip: '모두 접기',
          press: function () { oTree.collapseAll() }
        })
      ]
    })

    const oSearch = new SearchField({
      placeholder: '검색...',
      width: '100%',
      liveChange: function (oEvent) {
        const q = oEvent.getParameter('newValue').toLowerCase().trim()
        oModel.setData({ nodes: filterNodes(TREE_DATA, q) })
        if (q) oTree.expandToLevel(2)
      }
    })

    const oVBox = new VBox({
      width: '100%',
      height: '100%',
      items: [oToolbar, oSearch, oTree]
    })

    oVBox.placeAt(container)
    console.log('[Widget] placeAt 완료')

    instance._ui5Model = oModel
    instance._ui5Tree  = oTree
    instance._ui5VBox  = oVBox
  }

  function filterNodes (nodes, query) {
    if (!query) return nodes
    return nodes.map(function (n) {
      const childMatch = filterNodes(n.children || [], query)
      const selfMatch  = n.text.toLowerCase().includes(query)
      if (!selfMatch && childMatch.length === 0) return null
      return Object.assign({}, n, { children: selfMatch ? n.children : childMatch })
    }).filter(Boolean)
  }

  // ─── Web Component ────────────────────────────────────────
  class Main extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('root')

      this._ui5Model   = null
      this._ui5Tree    = null
      this._ui5VBox    = null
      this._container  = null
      this._treeBuilt  = false
    }

    connectedCallback () {
      console.log('[Widget] connectedCallback')

      // UI5는 Shadow DOM에 placeAt 불가 → Light DOM에 컨테이너 생성
      if (!this._container) {
        this._container = document.createElement('div')
        this._container.style.cssText = 'width:100%;height:100%;'
        this.appendChild(this._container)  // Light DOM에 붙임
        console.log('[Widget] Light DOM 컨테이너 생성')
      }

      if (this._treeBuilt) return

      waitForSAP((Tree, StandardTreeItem, JSONModel, Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox) => {
        if (this._treeBuilt) return
        this._treeBuilt = true
        buildTree(this._container, this, Tree, StandardTreeItem, JSONModel, Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox)
      })
    }

    disconnectedCallback () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
        this._ui5VBox = null
      }
      this._treeBuilt = false
    }

    onCustomWidgetResize (width, height) {
      console.log('[Widget] resize:', width, height)
      if (this._container) {
        this._container.style.width  = width  + 'px'
        this._container.style.height = height + 'px'
      }
    }

    onCustomWidgetAfterUpdate (changedProps) {
      // TODO: SAC dataBinding 연결
      // const binding = this.dataBinding
      // if (!binding || binding.state !== 'success') return
    }

    onCustomWidgetDestroy () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
      }
    }

    async render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') return
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
  console.log('[Widget] Custom Element 등록 완료: com-sap-sac-hierarchy-jjung-main')
})()
