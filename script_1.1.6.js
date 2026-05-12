(function () {

  const TREE_DATA = [
    {
      id: "AS", text: "아시아",
      children: [
        {
          id: "AS_KR", text: "대한민국",
          children: [
            { id: "AS_KR_SEL", text: "서울", children: [] },
            { id: "AS_KR_PUS", text: "부산", children: [] },
            { id: "AS_KR_ICN", text: "인천", children: [] }
          ]
        },
        {
          id: "AS_JP", text: "일본",
          children: [
            { id: "AS_JP_TYO", text: "도쿄",  children: [] },
            { id: "AS_JP_OSA", text: "오사카", children: [] }
          ]
        },
        {
          id: "AS_CN", text: "중국",
          children: [
            { id: "AS_CN_BEI", text: "베이징", children: [] },
            { id: "AS_CN_SHA", text: "상하이", children: [] }
          ]
        }
      ]
    },
    {
      id: "EU", text: "유럽",
      children: [
        {
          id: "EU_DE", text: "독일",
          children: [
            { id: "EU_DE_BER", text: "베를린",  children: [] },
            { id: "EU_DE_MUC", text: "뮌헨",    children: [] }
          ]
        },
        {
          id: "EU_FR", text: "프랑스",
          children: [
            { id: "EU_FR_PAR", text: "파리",   children: [] },
            { id: "EU_FR_LYO", text: "리옹",   children: [] }
          ]
        }
      ]
    },
    {
      id: "AM", text: "아메리카",
      children: [
        {
          id: "AM_US", text: "미국",
          children: [
            { id: "AM_US_NYC", text: "뉴욕",         children: [] },
            { id: "AM_US_LAX", text: "로스앤젤레스",   children: [] },
            { id: "AM_US_CHI", text: "시카고",        children: [] }
          ]
        },
        {
          id: "AM_BR", text: "브라질",
          children: [
            { id: "AM_BR_SAO", text: "상파울루",       children: [] },
            { id: "AM_BR_RIO", text: "리우데자네이루",  children: [] }
          ]
        }
      ]
    }
  ]

  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      #root {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
    </style>
    <div id="root" style="width:100%; height:100%;"></div>
  `

  // 모듈 목록 — 순서가 콜백 인자와 1:1 대응
  const MODULES = [
    'sap/m/Tree',             // 0
    'sap/m/StandardTreeItem', // 1
    'sap/ui/model/json/JSONModel', // 2
    'sap/m/Toolbar',          // 3
    'sap/m/Title',            // 4
    'sap/m/ToolbarSpacer',    // 5
    'sap/m/Button',           // 6
    'sap/m/SearchField',      // 7
    'sap/m/VBox',             // 8  ← 원본과 동일 위치 유지
    'sap/m/ScrollContainer'   // 9  ← 맨 뒤에 추가
  ]

  function loadUI5(cb) {
    if (window.sap && window.sap.ui && window.sap.ui.require) {
      sap.ui.require(MODULES, cb)
      return
    }
    if (!document.getElementById('sap-ui-bootstrap')) {
      const s = document.createElement('script')
      s.id = 'sap-ui-bootstrap'
      s.src = 'https://ui5.sap.com/1.120.1/resources/sap-ui-core.js'
      s.setAttribute('data-sap-ui-theme', 'sap_horizon')
      s.setAttribute('data-sap-ui-libs', 'sap.m')
      s.setAttribute('data-sap-ui-compatVersion', 'edge')
      s.setAttribute('data-sap-ui-async', 'false')
      s.onload = () => sap.ui.getCore().attachInit(() => sap.ui.require(MODULES, cb))
      document.head.appendChild(s)
    }
  }

  function filterNodes(nodes, query) {
    if (!query) return nodes
    return nodes.map(n => {
      const childMatch = filterNodes(n.children || [], query)
      const selfMatch  = n.text.toLowerCase().includes(query)
      if (!selfMatch && childMatch.length === 0) return null
      return Object.assign({}, n, { children: selfMatch ? n.children : childMatch })
    }).filter(Boolean)
  }

  function buildTree(container, instance) {
    sap.ui.require(MODULES,
      // 인자 순서가 MODULES 배열과 정확히 일치
      function (Tree, StandardTreeItem, JSONModel,
                Toolbar, Title, ToolbarSpacer, Button, SearchField,
                VBox, ScrollContainer) {

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
              instance.dispatchEvent(new CustomEvent('onNodeSelect', {
                detail: { id: oData.id, text: oData.text, level },
                bubbles: true,
                composed: true
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
            new Title({ text: '지역 계층 트리 (3레벨)' }),
            new ToolbarSpacer(),
            new Button({
              icon: 'sap-icon://expand-group',
              tooltip: '모두 펼치기',
              press: () => oTree.expandToLevel(2)
            }),
            new Button({
              icon: 'sap-icon://collapse-group',
              tooltip: '모두 접기',
              press: () => oTree.collapseAll()
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

        // Tree를 ScrollContainer로 감쌈
        const oScroll = new ScrollContainer({
          vertical: true,
          horizontal: true,
          width: '100%',
          height: '100%',
          content: [oTree]
        })

        const oVBox = new VBox({
          width: '100%',
          height: '100%',
          items: [oToolbar, oSearch, oScroll]
        })

        // 렌더 후 flex 보정: ScrollContainer가 남은 높이를 채우게 함
        oVBox.addEventDelegate({
          onAfterRendering: function () {
            var vDom = oVBox.getDomRef()
            if (!vDom) return
            vDom.style.display       = 'flex'
            vDom.style.flexDirection = 'column'
            vDom.style.height        = '100%'
            vDom.style.overflow      = 'hidden'

            var sDom = oScroll.getDomRef()
            if (!sDom) return
            sDom.style.flex      = '1 1 0'
            sDom.style.minHeight = '0'
          }
        })

        oVBox.placeAt(container)

        instance._ui5Model  = oModel
        instance._ui5Tree   = oTree
        instance._ui5VBox   = oVBox
        instance._ui5Scroll = oScroll
      }
    )
  }

  class Main extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('root')

      this._ui5Model  = null
      this._ui5Tree   = null
      this._ui5VBox   = null
      this._ui5Scroll = null
    }

    connectedCallback () {
      if (!this._container) {
        this._container = document.createElement('div')
        this._container.style.cssText = 'width:100%;height:100%;'
        this.appendChild(this._container)
      }
      loadUI5(() => buildTree(this._container, this))
    }

    disconnectedCallback () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
        this._ui5VBox = null
      }
    }

    onCustomWidgetResize (width, height) {
      if (this._container) {
        this._container.style.width  = width  + 'px'
        this._container.style.height = height + 'px'
      }
    }

    onCustomWidgetAfterUpdate (changedProps) {}

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
})()