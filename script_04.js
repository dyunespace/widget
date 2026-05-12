(function () {

  // ─────────────────────────────────────────────
  // 샘플 데이터 (3레벨)
  // 나중에 dataBinding으로 교체 예정
  // ─────────────────────────────────────────────
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
            { id: "AM_US_NYC", text: "뉴욕",      children: [] },
            { id: "AM_US_LAX", text: "로스앤젤레스", children: [] },
            { id: "AM_US_CHI", text: "시카고",    children: [] }
          ]
        },
        {
          id: "AM_BR", text: "브라질",
          children: [
            { id: "AM_BR_SAO", text: "상파울루",   children: [] },
            { id: "AM_BR_RIO", text: "리우데자네이루", children: [] }
          ]
        }
      ]
    }
  ]

  // ─────────────────────────────────────────────
  // Shadow DOM 템플릿
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // UI5 로드 헬퍼
  // ─────────────────────────────────────────────
  function loadUI5(cb) {
    // 케이스 A: SAC 런타임 - UI5 이미 로드됨
    if (window.sap && window.sap.ui && window.sap.ui.require) {
      sap.ui.require([
        'sap/m/Tree',
        'sap/m/StandardTreeItem',
        'sap/ui/model/json/JSONModel',
        'sap/m/Toolbar',
        'sap/m/Title',
        'sap/m/ToolbarSpacer',
        'sap/m/Button',
        'sap/m/SearchField',
        'sap/m/VBox'
      ], cb)
      return
    }
    // 케이스 B: 로컬 테스트 - CDN에서 부트스트랩
    if (!document.getElementById('sap-ui-bootstrap')) {
      const s = document.createElement('script')
      s.id = 'sap-ui-bootstrap'
      s.src = 'https://ui5.sap.com/1.120.1/resources/sap-ui-core.js'
      s.setAttribute('data-sap-ui-theme', 'sap_horizon')
      s.setAttribute('data-sap-ui-libs', 'sap.m')
      s.setAttribute('data-sap-ui-compatVersion', 'edge')
      s.setAttribute('data-sap-ui-async', 'false')
      s.onload = () => sap.ui.getCore().attachInit(() => sap.ui.require([
        'sap/m/Tree',
        'sap/m/StandardTreeItem',
        'sap/ui/model/json/JSONModel',
        'sap/m/Toolbar',
        'sap/m/Title',
        'sap/m/ToolbarSpacer',
        'sap/m/Button',
        'sap/m/SearchField',
        'sap/m/VBox'
      ], cb))
      document.head.appendChild(s)
    }
  }

  // ─────────────────────────────────────────────
  // 검색 필터 유틸
  // ─────────────────────────────────────────────
  function filterNodes(nodes, query) {
    if (!query) return nodes
    return nodes.map(n => {
      const childMatch = filterNodes(n.children || [], query)
      const selfMatch  = n.text.toLowerCase().includes(query)
      if (!selfMatch && childMatch.length === 0) return null
      return Object.assign({}, n, { children: selfMatch ? n.children : childMatch })
    }).filter(Boolean)
  }

  // ─────────────────────────────────────────────
  // UI5 트리 빌드
  // ─────────────────────────────────────────────
  function buildTree(container, instance) {
    sap.ui.require([
      'sap/m/Tree',
      'sap/m/StandardTreeItem',
      'sap/ui/model/json/JSONModel',
      'sap/m/Toolbar',
      'sap/m/Title',
      'sap/m/ToolbarSpacer',
      'sap/m/Button',
      'sap/m/SearchField',
      'sap/m/VBox'
    ], function (Tree, StandardTreeItem, JSONModel,
                 Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox) {

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

      const oVBox = new VBox({
        width: '100%',
        height: '100%',
        items: [oToolbar, oSearch, oTree]
      })

      oVBox.placeAt(container)

      // 인스턴스에 참조 저장 (onCustomWidgetAfterUpdate에서 갱신용)
      instance._ui5Model = oModel
      instance._ui5Tree  = oTree
      instance._ui5VBox  = oVBox
    })
  }

  // ─────────────────────────────────────────────
  // Web Component
  // ─────────────────────────────────────────────
  class Main extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('root')

      this._ui5Model = null
      this._ui5Tree  = null
      this._ui5VBox  = null
    }

    connectedCallback () {
      // UI5는 Shadow DOM 미지원 → Light DOM 컨테이너에 렌더링
      if (!this._container) {
        this._container = document.createElement('div')
        this._container.style.cssText = 'width:100%;height:100%;overflow-y:auto;overflow-x:hidden;'
        // Shadow DOM 바깥(Light DOM)에 붙임
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

    onCustomWidgetAfterUpdate (changedProps) {
      /**
       * TODO: SAC dataBinding 연결 시 이 부분 수정
       *
       * const binding = this.dataBinding
       * if (!binding || binding.state !== 'success') return
       * const converted = transformToTree(binding)   // 변환 함수 작성
       * if (this._ui5Model) this._ui5Model.setData({ nodes: converted })
       */
    }

    onCustomWidgetDestroy () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
      }
    }

    async render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') return
      // 현재는 샘플 데이터 사용 중
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
})()
