(function () {

  // ─────────────────────────────────────────────
  // 샘플 데이터 (3레벨)
  // ─────────────────────────────────────────────
  const TREE_DATA = [
    {
      id: "AS", text: "아시아",
      children: [
        {
          id: "AS_KR", text: "대한민국",
          children: [
            { id: "AS_KR_SEL", text: "서울",  children: [] },
            { id: "AS_KR_PUS", text: "부산",  children: [] },
            { id: "AS_KR_ICN", text: "인천",  children: [] }
          ]
        },
        {
          id: "AS_JP", text: "일본",
          children: [
            { id: "AS_JP_TYO", text: "도쿄",   children: [] },
            { id: "AS_JP_OSA", text: "오사카",  children: [] }
          ]
        },
        {
          id: "AS_CN", text: "중국",
          children: [
            { id: "AS_CN_BEI", text: "베이징",  children: [] },
            { id: "AS_CN_SHA", text: "상하이",  children: [] }
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
            { id: "EU_DE_BER", text: "베를린", children: [] },
            { id: "EU_DE_MUC", text: "뮌헨",   children: [] }
          ]
        },
        {
          id: "EU_FR", text: "프랑스",
          children: [
            { id: "EU_FR_PAR", text: "파리", children: [] },
            { id: "EU_FR_LYO", text: "리옹", children: [] }
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
            { id: "AM_US_NYC", text: "뉴욕",          children: [] },
            { id: "AM_US_LAX", text: "로스앤젤레스",   children: [] },
            { id: "AM_US_CHI", text: "시카고",         children: [] }
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

  // ─────────────────────────────────────────────
  // 스타일
  // ─────────────────────────────────────────────
  const STYLES = `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: "72", "72full", Arial, Helvetica, sans-serif;
      font-size: 14px;
      box-sizing: border-box;
    }

    #widget {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* ── 툴바 ── */
    #toolbar {
      display: flex;
      align-items: center;
      padding: 0 8px;
      height: 44px;
      min-height: 44px;
      background: #f5f6f7;
      border-bottom: 1px solid #d9d9d9;
      gap: 4px;
    }
    #toolbar-title {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: #32363a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tb-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      color: #32363a;
    }
    .tb-btn:hover { background: #e5e5e5; }

    /* ── 검색 ── */
    #search-wrap {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e5e5;
      min-height: 40px;
      box-sizing: border-box;
    }
    #search {
      width: 100%;
      box-sizing: border-box;
      padding: 5px 8px;
      border: 1px solid #bbb;
      border-radius: 4px;
      font-size: 13px;
      outline: none;
    }
    #search:focus { border-color: #0070f2; }

    /* ── 트리 스크롤 영역 ── */
    #tree-wrap {
      flex: 1 1 0;
      min-height: 0;
      overflow: auto;   /* 세로+가로 스크롤 */
      padding: 4px 0;
    }

    /* ── 트리 노드 ── */
    .tree-node {}
    .tree-row {
      display: flex;
      align-items: center;
      height: 36px;
      padding-right: 12px;
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
    }
    .tree-row:hover { background: #f0f4ff; }
    .tree-row.selected { background: #e5f0ff; }

    .tree-indent {
      display: inline-block;
      flex-shrink: 0;
    }
    .tree-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      font-size: 11px;
      color: #555;
      transition: transform 0.15s;
    }
    .tree-toggle.open { transform: rotate(90deg); }
    .tree-toggle.leaf { visibility: hidden; }

    .tree-label {
      margin-left: 4px;
      color: #32363a;
      font-size: 14px;
    }

    .tree-children {
      display: block;
    }
    .tree-children.collapsed {
      display: none;
    }
  `

  // ─────────────────────────────────────────────
  // 헬퍼
  // ─────────────────────────────────────────────
  function filterNodes(nodes, q) {
    if (!q) return nodes
    return nodes.map(n => {
      const childMatch = filterNodes(n.children || [], q)
      const self = n.text.toLowerCase().includes(q)
      if (!self && !childMatch.length) return null
      return Object.assign({}, n, { children: self ? n.children : childMatch })
    }).filter(Boolean)
  }

  // ─────────────────────────────────────────────
  // 트리 DOM 빌더
  // ─────────────────────────────────────────────
  function buildNodeEl(node, depth, instance, expandAll) {
    const hasChildren = node.children && node.children.length > 0
    const indent = depth * 20   // px

    // 노드 컨테이너
    const nodeEl = document.createElement('div')
    nodeEl.className = 'tree-node'

    // 행
    const row = document.createElement('div')
    row.className = 'tree-row'
    row.dataset.id    = node.id
    row.dataset.text  = node.text
    row.dataset.depth = depth

    // 인덴트
    const indentEl = document.createElement('span')
    indentEl.className = 'tree-indent'
    indentEl.style.width = indent + 'px'

    // 토글 아이콘
    const toggle = document.createElement('span')
    toggle.className = 'tree-toggle' + (hasChildren ? '' : ' leaf')
    toggle.textContent = '▶'

    // 라벨
    const label = document.createElement('span')
    label.className = 'tree-label'
    label.textContent = node.text

    row.appendChild(indentEl)
    row.appendChild(toggle)
    row.appendChild(label)
    nodeEl.appendChild(row)

    // 자식 컨테이너
    let childrenEl = null
    if (hasChildren) {
      childrenEl = document.createElement('div')
      childrenEl.className = 'tree-children' + (expandAll ? '' : ' collapsed')
      if (!expandAll) toggle.classList.remove('open')
      else toggle.classList.add('open')

      node.children.forEach(child => {
        childrenEl.appendChild(buildNodeEl(child, depth + 1, instance, expandAll))
      })
      nodeEl.appendChild(childrenEl)

      // 토글 클릭
      toggle.addEventListener('click', function (e) {
        e.stopPropagation()
        const collapsed = childrenEl.classList.toggle('collapsed')
        toggle.classList.toggle('open', !collapsed)
      })
      row.addEventListener('click', function (e) {
        e.stopPropagation()
        const collapsed = childrenEl.classList.toggle('collapsed')
        toggle.classList.toggle('open', !collapsed)
        selectRow(row, instance, depth)
      })
    } else {
      // 리프 노드
      row.addEventListener('click', function (e) {
        e.stopPropagation()
        selectRow(row, instance, depth)
      })
    }

    return nodeEl
  }

  function selectRow(row, instance, depth) {
    // 이전 선택 해제
    const prev = instance._root.querySelector('.tree-row.selected')
    if (prev) prev.classList.remove('selected')
    row.classList.add('selected')

    instance.dispatchEvent(new CustomEvent('onNodeSelect', {
      detail: { id: row.dataset.id, text: row.dataset.text, level: depth + 1 },
      bubbles: true, composed: true
    }))
  }

  function renderTree(container, data, instance, expandAll) {
    container.innerHTML = ''
    data.forEach(node => {
      container.appendChild(buildNodeEl(node, 0, instance, expandAll))
    })
  }

  // ─────────────────────────────────────────────
  // Web Component
  // ─────────────────────────────────────────────
  class Main extends HTMLElement {
    constructor () {
      super()
      this._root = this.attachShadow({ mode: 'open' })
      this._currentData  = TREE_DATA
      this._expandAll    = false
    }

    connectedCallback () {
      this._build()
    }

    _build () {
      // 이미 빌드됐으면 스킵
      if (this._root.getElementById('widget')) return

      // 스타일
      const style = document.createElement('style')
      style.textContent = STYLES

      // 위젯 루트
      const widget = document.createElement('div')
      widget.id = 'widget'

      // ── 툴바 ──
      const toolbar = document.createElement('div')
      toolbar.id = 'toolbar'

      const title = document.createElement('span')
      title.id = 'toolbar-title'
      title.textContent = '지역 계층 트리 (3레벨)'

      const btnExpand = document.createElement('button')
      btnExpand.className = 'tb-btn'
      btnExpand.title = '모두 펼치기'
      btnExpand.textContent = '⊞'
      btnExpand.addEventListener('click', () => {
        this._root.querySelectorAll('.tree-children').forEach(el => {
          el.classList.remove('collapsed')
        })
        this._root.querySelectorAll('.tree-toggle:not(.leaf)').forEach(el => {
          el.classList.add('open')
        })
      })

      const btnCollapse = document.createElement('button')
      btnCollapse.className = 'tb-btn'
      btnCollapse.title = '모두 접기'
      btnCollapse.textContent = '⊟'
      btnCollapse.addEventListener('click', () => {
        this._root.querySelectorAll('.tree-children').forEach(el => {
          el.classList.add('collapsed')
        })
        this._root.querySelectorAll('.tree-toggle:not(.leaf)').forEach(el => {
          el.classList.remove('open')
        })
      })

      toolbar.appendChild(title)
      toolbar.appendChild(btnExpand)
      toolbar.appendChild(btnCollapse)

      // ── 검색 ──
      const searchWrap = document.createElement('div')
      searchWrap.id = 'search-wrap'

      const searchInput = document.createElement('input')
      searchInput.id = 'search'
      searchInput.type = 'text'
      searchInput.placeholder = '검색...'
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim()
        const filtered = filterNodes(TREE_DATA, q)
        renderTree(treeWrap, filtered, this, !!q)
      })
      searchWrap.appendChild(searchInput)

      // ── 트리 영역 ──
      const treeWrap = document.createElement('div')
      treeWrap.id = 'tree-wrap'

      renderTree(treeWrap, TREE_DATA, this, false)

      widget.appendChild(toolbar)
      widget.appendChild(searchWrap)
      widget.appendChild(treeWrap)

      this._root.appendChild(style)
      this._root.appendChild(widget)
    }

    onCustomWidgetResize (width, height) {
      const widget = this._root.getElementById('widget')
      if (widget) {
        widget.style.width  = width  + 'px'
        widget.style.height = height + 'px'
      }
    }

    onCustomWidgetAfterUpdate (changedProps) {
      // TODO: dataBinding 연결 시 여기서 renderTree 호출
    }

    onCustomWidgetDestroy () {
      this._root.innerHTML = ''
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
})()