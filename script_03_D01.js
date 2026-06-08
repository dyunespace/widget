(function () {

  // ─── 1. SAC 평면 데이터를 계층형(Tree)으로 변환하는 마법의 함수 ───
  function buildHierarchyFromSAC(dataBinding) {
    if (!dataBinding || !dataBinding.data) return [];

    const rows = dataBinding.data;
    const treeMap = [];

    rows.forEach(row => {
      // dimensions_0, dimensions_1 등 차원 키만 추출해서 순서대로 정렬
      const dimKeys = Object.keys(row).filter(k => k.startsWith('dimensions_')).sort();
      let currentLevel = treeMap;

      dimKeys.forEach(key => {
        const dimObj = row[key];
        const dimId = dimObj.id;
        const dimText = dimObj.label || dimObj.id;

        // 현재 레벨에 이미 해당 노드가 있는지 확인
        let existingNode = currentLevel.find(n => n.id === dimId);

        if (!existingNode) {
          // 없으면 새로 만들어서 넣기 (selected 속성도 미리 세팅)
          existingNode = { id: dimId, text: dimText, children: [], selected: false };
          currentLevel.push(existingNode);
        }

        // 다음 자식 레벨로 포인터 이동
        currentLevel = existingNode.children;
      });
    });

    return treeMap;
  }

  // ─── 2. 검색 필터 (변경 없음) ────────────────────────────
  function filterNodes (nodes, query) {
    if (!query) return nodes;
    return nodes.map(n => {
      const childMatch = filterNodes(n.children || [], query);
      const selfMatch  = n.text.toLowerCase().indexOf(query) >= 0;
      if (!selfMatch && childMatch.length === 0) return null;
      return { id: n.id, text: n.text, children: selfMatch ? n.children : childMatch, selected: n.selected };
    }).filter(Boolean);
  }

  // ─── 3. UI5 트리 빌드 및 이벤트 설정 ───────────────────────
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

      // 초기엔 빈 데이터로 시작
      const oModel = new JSONModel({ nodes: [] });

      const oTree = new Tree({
        mode: 'MultiSelect', 
        includeItemInSelection: true,
        width: '100%',
        selectionChange: function (oEvent) {
          const oItem = oEvent.getParameter('listItem');
          const bSelected = oEvent.getParameter('selected'); // 체크/해제 여부

          if (oItem) {
            const oCtx = oItem.getBindingContext();

            const oNodeData = oCtx.getObject();
            console.log("oNodeData.selected=");
            console.log(oNodeData.selected);

            
            // 부모 클릭 시 자식 전체 상태 변경 로직
            const toggleChildren = function(node, isChecked) {
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                  child.selected = isChecked;
                  toggleChildren(child, isChecked);
                });
              }
            };

            //oNodeData.selected = bSelected;
            toggleChildren(oNodeData, oNodeData.selected);
            
            // 데이터 모델 강제 새로고침하여 화면의 체크박스 상태 업데이트
            //oModel.refresh(true);
          }

          // 화면 전체에서 선택된 노드 수집
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
          console.log('[Widget] 선택된 항목들:', aSelectedData);
          
          instance.dispatchEvent(new CustomEvent('onNodeSelect', {
            detail: { selectedNodes: aSelectedData },
            bubbles: true,
            composed: true
          }));
        }
      });

      // 데이터와 화면의 selected 속성 연결
      oTree.bindItems({
        path: '/nodes',
        template: new StandardTreeItem({ 
          title: '{text}',
          selected: '{selected}' 
        }),
        parameters: { arrayNames: ['children'] }
      });
      
      oTree.setModel(oModel);

      const oToolbar = new Toolbar({
        content: [
          new Title({ text: 'SAC Tree by SAP UI5 v6.3.15:24' }),
          new ToolbarSpacer(),
          new Button({
            icon: 'sap-icon://expand-group',
            tooltip: '모두 펼치기',
            press: function () { oTree.expandToLevel(99); } // 모든 레벨 펼치기
          }),
          new Button({
            icon: 'sap-icon://collapse-group',
            tooltip: '모두 접기',
            press: function () { oTree.collapseAll(); }
          })
        ]
      });

      const oSearch = new SearchField({
        placeholder: '검색...',
        width: '100%',
        liveChange: function (oEvent) {
          const q = oEvent.getParameter('newValue').toLowerCase().trim();
          // 원본 데이터를 다시 변환하여 필터링 적용
          const fullData = buildHierarchyFromSAC(instance.dataBinding);
          oModel.setData({ nodes: filterNodes(fullData, q) });
          if (q) oTree.expandToLevel(99);
        }
      });

      const oVBox = new VBox({
        width: '100%',
        height: '100%',
        items: [oToolbar, oSearch, oTree]
      });

      oVBox.placeAt(container);

      instance._ui5Model = oModel;
      instance._ui5Tree  = oTree;
      instance._ui5VBox  = oVBox;
    });
  }

  // ─── 4. Web Component 코어 ─────────────────────────────────
  class Main extends HTMLElement {
    constructor () {
      super();
      this._ui5Model  = null;
      this._ui5Tree   = null;
      this._ui5VBox   = null;
      this._container = null;
      this._built     = false;
    }

    connectedCallback () {
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.style.cssText = 'width:100%;height:100%;overflow-y:auto;overflow-x:hidden;';
        this.appendChild(this._container);
      }

      if (this._built) return;
      this._built = true;

      if (window.sap && window.sap.ui && window.sap.ui.require) {
        buildUI5Tree(this._container, this);
      } else {
        this._container.textContent = 'SAP UI5를 찾을 수 없습니다.';
      }
    }

    disconnectedCallback () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy(); } catch (e) {}
        this._ui5VBox = null;
      }
      this._built = false;
    }

    onCustomWidgetResize (width, height) {
      if (this._container) {
        this._container.style.width  = width  + 'px';
        this._container.style.height = height + 'px';
      }
    }

    // ⭐ SAC에서 데이터가 들어오거나 바뀔 때마다 실행되는 마법의 구간
    onCustomWidgetAfterUpdate (changedProps) {
      const binding = this.dataBinding;
      if (!binding || binding.state !== 'success') return;

      // UI5 모델이 준비되었다면, SAC 데이터를 트리형태로 바꿔서 밀어넣기
      if (this._ui5Model) {
        const treeData = buildHierarchyFromSAC(binding);
        this._ui5Model.setData({ nodes: treeData });
        
        // 데이터가 로드되면 첫 번째 레벨을 자동으로 펼침
        if (this._ui5Tree) {
          this._ui5Tree.expandToLevel(1);
        }
      }
    }

    onCustomWidgetDestroy () {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy(); } catch (e) {}
      }
    }

	getSelected() {
	  const aSelectedData = [];
	  const collectSelected = function(nodes, currentLevel) {
		nodes.forEach(n => {
		  if (n.selected) {
			aSelectedData.push({
			  id: n.id,
			  description: n.text,
			  parentId: n.parentId || '',
			  properties: { level: currentLevel }  // ← 여기!
			});
		  }
		  if (n.children) collectSelected(n.children, currentLevel + 1);
		});
	  };

	  collectSelected(this._ui5Model.getProperty('/nodes') || [], 1);
	  return aSelectedData;
	}
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main);
})();
