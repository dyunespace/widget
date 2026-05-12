(function () {

  // ─── 샘플 데이터 (3레벨) ──────────────────────────────────
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
        },
        {
          id: 'AS_CN', text: '중국',
          children: [
            { id: 'AS_CN_BEI', text: '베이징', children: [] },
            { id: 'AS_CN_SHA', text: '상하이', children: [] }
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
        },
        {
          id: 'EU_FR', text: '프랑스',
          children: [
            { id: 'EU_FR_PAR', text: '파리', children: [] },
            { id: 'EU_FR_LYO', text: '리옹', children: [] }
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
            { id: 'AM_US_NYC', text: '뉴욕',       children: [] },
            { id: 'AM_US_LAX', text: '로스앤젤레스', children: [] },
            { id: 'AM_US_CHI', text: '시카고',      children: [] }
          ]
        },
        {
          id: 'AM_BR', text: '브라질',
          children: [
            { id: 'AM_BR_SAO', text: '상파울루',      children: [] },
            { id: 'AM_BR_RIO', text: '리우데자네이루', children: [] }
          ]
        }
      ]
    }
  ]

  // ─── 검색 필터 ────────────────────────────────────────────
  function filterNodes (nodes, query) {
    if (!query) return nodes
    return nodes.map(function (n) {
      var childMatch = filterNodes(n.children || [], query)
      var selfMatch  = n.text.toLowerCase().indexOf(query) >= 0
      if (!selfMatch && childMatch.length === 0) return null
      return { id: n.id, text: n.text, children: selfMatch ? n.children : childMatch }
    }).filter(Boolean)
  }

  // ─── UI5 require 후 트리 빌드 ─────────────────────────────
  function buildUI5Tree (container, instance) {
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

      var oModel = new JSONModel({ nodes: TREE_DATA })

      const oTree = new Tree({
        mode: 'MultiSelect',
        includeItemInSelection: true,
        width: '100%',
        selectionChange: function (oEvent) {
          const oItem = oEvent.getParameter('listItem')
          const bSelected = oEvent.getParameter('selected') // 방금 클릭해서 체크됐는지, 해제됐는지 여부

          if (oItem) {
            const oCtx = oItem.getBindingContext()
            const oNodeData = oCtx.getObject()

            // 1. 하위 노드들을 끝까지 찾아가며 상태를 똑같이 맞춰주는 마법의 함수
            const toggleChildren = function(node, isChecked) {
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                  child.selected = isChecked;
                  toggleChildren(child, isChecked); // 손자, 증손자까지 파고듦
                });
              }
            };

            // 2. 내가 누른 노드와 그 밑의 모든 자식 데이터 변경
            oNodeData.selected = bSelected;
            toggleChildren(oNodeData, bSelected);

            // 3. 데이터가 바뀌었으니 화면에 즉시 반영 (접혀있던 노드도 나중에 펼치면 체크되어 있음!)
            oModel.refresh(true);
          }

          // 4. 화면이 아닌 '데이터 모델 전체'를 뒤져서 체크된 애들만 싹 다 모아오기
          const aSelectedData = [];
          const collectSelected = function(nodes, currentLevel) {
            nodes.forEach(n => {
              if (n.selected) {
                aSelectedData.push({ id: n.id, text: n.text, level: currentLevel });
              }
              if (n.children) collectSelected(n.children, currentLevel + 1);
            });
          };

          collectSelected(oModel.getProperty('/nodes') || [], 1);

          console.log('[Widget] 현재 선택된 전체 노드:', aSelectedData);

          // 5. SAC 밖으로 선택된 데이터 배열 쏴주기
          instance.dispatchEvent(new CustomEvent('onNodeSelect', {
            detail: { selectedNodes: aSelectedData },
            bubbles: true,
            composed: true
          }));
        }
      })

      // 기존 oTree.bindItems 부분 교체
      oTree.bindItems({
        path: '/nodes',
        template: new StandardTreeItem({ 
          title: '{text}',
          selected: '{selected}'
        }),
        parameters: { arrayNames: ['children'] }
      })
      oTree.setModel(oModel)

      var oToolbar = new Toolbar({
        content: [
          new Title({ text: '지역 계층 트리 (3레벨)' }),
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

      var oSearch = new SearchField({
        placeholder: '검색...',
        width: '100%',
        liveChange: function (oEvent) {
          var q = oEvent.getParameter('newValue').toLowerCase().trim()
          oModel.setData({ nodes: filterNodes(TREE_DATA, q) })
          if (q) oTree.expandToLevel(2)
        }
      })

      var oVBox = new VBox({
        width: '100%',
        height: '100%',
        items: [oToolbar, oSearch, oTree]
      })

      oVBox.placeAt(container)

      instance._ui5Model = oModel
      instance._ui5Tree  = oTree
      instance._ui5VBox  = oVBox
    })
  }

  // ─── Web Component ────────────────────────────────────────
  class Main extends HTMLElement {
    constructor () {
      super()
      this._ui5Model  = null
      this._ui5Tree   = null
      this._ui5VBox   = null
      this._container = null
      this._built     = false
    }

    connectedCallback () {
      // Shadow DOM 사용 안 함 → Light DOM에 직접 div 생성
      if (!this._container) {
        this._container = document.createElement('div')
        this._container.style.cssText = 'width:100%;height:100%;overflow-y:auto;overflow-x:hidden;'
        this.appendChild(this._container)
      }

      if (this._built) return
      this._built = true

      // SAC 런타임엔 sap.ui 이미 존재
      if (window.sap && window.sap.ui && window.sap.ui.require) {
        buildUI5Tree(this._container, this)
      } else {
        // 로컬 테스트용 fallback (SAC에서는 타지 않음)
        this._container.textContent = 'SAP UI5를 찾을 수 없습니다.'
      }
    }

    disconnectedCallback () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
        this._ui5VBox = null
      }
      this._built = false
    }

    onCustomWidgetResize (width, height) {
      if (this._container) {
        this._container.style.width  = width  + 'px'
        this._container.style.height = height + 'px'
      }
    }

    onCustomWidgetAfterUpdate (changedProps) {
      // TODO: SAC dataBinding 연결
      // var binding = this.dataBinding
      // if (!binding || binding.state !== 'success') return
      // this._ui5Model.setData({ nodes: transformData(binding) })
    }

    onCustomWidgetDestroy () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy() } catch (e) {}
      }
    }

    async render () {
      var dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') return
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
})()
