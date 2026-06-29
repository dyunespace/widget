(function () {
	console.log("New Tree 20260626_13:42 v1.1 Debug");
	/* 
	buildHierarchyFromSAC
	filterNodes
	buildUI5Tree
	  const oModel = new JSONModel({ nodes: [] });
	  const oTree = new Tree({ ~
	  oTree.bindItems({ ~
	  oTree.setModel(oModel);
	  const oToolbar = new Toolbar({ ~
	  const oSearch = new SearchField({ ~
	  const oVBox = new VBox({ ~
	  oVBox.placeAt(container);
	Main
	└ constructor
	└ connectedCallback
	└ disconnectedCallback
	└ onCustomWidgetResize
	└ onCustomWidgetAfterUpdate
	└ onCustomWidgetDestroy
	└ getSelected
	└ setExpandLevel(level)
	customElements.define('com-sap-sac-hierarchy-jjung-main', Main);
	*/
  
	// <7> SAC 평면 데이터를 계층형(Tree)으로 변환
	function buildHierarchyFromSAC(dataBinding) {
		if (!dataBinding || !dataBinding.data) return [];

		const rows = dataBinding.data;
		if (rows.length === 0) return [];

		const treeMap = [];
		// dimensions_0, dimensions_1 등 차원 키만 추출해서 순서대로 정렬
		const dimKeys = Object.keys(rows[0]).filter(k => k.startsWith('dimensions_')).sort();

		rows.forEach(row => {
			let currentLevel = treeMap; //주소참조

			dimKeys.forEach(key => {
				const dimObj = row[key];                        
				const dimId = dimObj.id;
				const dimText = dimObj.label || dimObj.id;

				// 현재 레벨에 이미 해당 노드가 있는지 확인
				let existingNode = currentLevel.find(n => n.id === dimId); //주소참조

				if (!existingNode) {
					existingNode = { id: dimId, text: dimText, children: [], selected: false };
					currentLevel.push(existingNode); //existingNode=>treeMap에 연결됨
				}

				// 다음 자식 레벨로 포인터 이동
				currentLevel = existingNode.children; //treeMap내 해당노드의 children
			});
		});

		return treeMap;
	}

	// Search용 필터 함수
	function filterNodes (nodes, query) {
		if (!query) return nodes;
		return nodes.map(n => {
			const childMatch = filterNodes(n.children || [], query);
			const selfMatch  = n.text.toLowerCase().indexOf(query) >= 0;
			if (!selfMatch && childMatch.length === 0) return null;
			return { id: n.id, text: n.text, children: selfMatch ? n.children : childMatch, selected: n.selected };
		}).filter(Boolean);
	}

	// <5> SAPUI5 요소들 배치 및 이벤트 정의
	function buildUI5Tree (container, instance) { // instance = this
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

						// 부모 클릭 시 자식 전체 상태 변경 로직
						const toggleChildren = function(node, isChecked) {
							if (node.children && node.children.length > 0) {
								node.children.forEach(child => {
								child.selected = isChecked; 
								toggleChildren(child, isChecked);
								});
							}
						};

						// oNodeData.selected = bSelected; //이미 지정되어있음
						toggleChildren(oNodeData, bSelected);

						// 데이터 모델 강제 새로고침하여 화면의 체크박스 상태 업데이트
						//oModel.refresh(true); //selected가 지정되어있으므로 필요없음
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
					new Title({ text: 'SAC 연동 트리' }),
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
			
			// 🌟 [추가] UI5 로딩이 늦게 끝나서 아까 대기 중이던 데이터가 있다면 지금 즉시 그려줍니다!
			if (instance._lastTreeData) {
				const finalData = instance._showAllNode
					? [{ id: 'ALL', text: instance._showAllNodeText || 'All', selected: false, children: instance._lastTreeData }]
					: instance._lastTreeData;
				
				oModel.setData({ nodes: finalData });
				oTree.expandToLevel(instance._defaultExpandLevel);
			}
		});
	}

	// <2> Main Class 실행
	class Main extends HTMLElement {
		
		// <3> 내부 변수 초기화
		constructor () {
			super();
			this._ui5Model  = null;
			this._ui5Tree   = null;
			this._ui5VBox   = null;
			this._container = null;
			this._built     = false;
			this._showAllNode = false;
			this._showAllNodeText = "All";
			this._defaultExpandLevel = 1;
			this._lastTreeData = null;
			this._treeFontFamily = "Arial, sans-serif";
			this._treeFontSize = 13;
			this._treeFontBold = false;
			this._treeFontColor = "#32363a";
			this._fontStyleEl = null;
			this._widgetUid = 'hwid_' + Math.random().toString(36).slice(2);
		}
		
		// <4> 화면에 배치되면 실행
		connectedCallback () {
			if (!this._container) {
				this._container = document.createElement('div');
				this._container.className = this._widgetUid;
				this._container.style.cssText = 'width:100%;height:100%;overflow-y:auto;overflow-x:hidden;';
				this.appendChild(this._container);

				this._fontStyleEl = document.createElement('style');
				this._container.appendChild(this._fontStyleEl);
				
				// 🌟 [최종 해결책] 마우스/포인터 이벤트를 완벽하게 복제해서 SAC 껍데기로 전달
				const forwardEvent = (e) => {
					// e.isTrusted가 true인 경우(사람이 직접 클릭한 진짜 이벤트일 때)만 복제
					if (e.isTrusted) {
						const clone = new MouseEvent(e.type, {
							bubbles: true,
							composed: true,
							cancelable: true,
							view: window,
							clientX: e.clientX, // 진짜 마우스 X 좌표
							clientY: e.clientY  // 진짜 마우스 Y 좌표
						});
						this.dispatchEvent(clone);
					}
				};
				
				// mousedown, click, pointerdown 3가지를 모두 잡아냅니다.
				this._container.addEventListener('mousedown', forwardEvent, true);
				this._container.addEventListener('pointerdown', forwardEvent, true);
				this._container.addEventListener('click', forwardEvent, true);
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

		// <6> SAC에서 데이터가 들어오거나 바뀔 때마다 실행
		onCustomWidgetAfterUpdate (changedProps) {
			if ('showAllNode' in changedProps) {
				this._showAllNode = changedProps.showAllNode;
			}
			if ('showAllNodeText' in changedProps) {
				this._showAllNodeText = changedProps.showAllNodeText || 'All';
			}
			if ('defaultExpandLevel' in changedProps) {
				this._defaultExpandLevel = changedProps.defaultExpandLevel !== undefined ? changedProps.defaultExpandLevel : 1;
			}
			if ('treeFontFamily' in changedProps) {
				this._treeFontFamily = changedProps.treeFontFamily;
			}
			if ('treeFontSize' in changedProps) {
				this._treeFontSize = changedProps.treeFontSize;
			}
			if ('treeFontBold' in changedProps) {
				this._treeFontBold = changedProps.treeFontBold;
			}
			if ('treeFontColor' in changedProps) {
				this._treeFontColor = changedProps.treeFontColor;
			}
			this._applyFontStyle();

			const binding = this.dataBinding;
			//if (!binding || binding.state !== 'success') return;
			
			if (binding && binding.state === 'success') {
				this._lastTreeData = buildHierarchyFromSAC(binding);
			}

			if (!this._lastTreeData) return;
			if (this._ui5Model) {
				const finalData = this._showAllNode
				? [{ id: 'ALL', text: this._showAllNodeText || 'All', selected: false, children: this._lastTreeData }]
				: this._lastTreeData;

				this._ui5Model.setData({ nodes: finalData });

				if (this._ui5Tree) {
					this._ui5Tree.collapseAll();
					this._ui5Tree.expandToLevel(this._defaultExpandLevel);
				}
			}
		}

		onCustomWidgetDestroy () {
			if (this._ui5VBox) {
				try { this._ui5VBox.destroy(); } catch (e) {}
			}
		}
		
		// Custom Method 영역
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

		setExpandLevel(level) {
			console.log('[Widget] setExpandLevel 호출:', level);
			if (this._ui5Tree) {
				this._ui5Tree.collapseAll();           // 먼저 전부 접고
				this._ui5Tree.expandToLevel(level);    // 그 다음 원하는 레벨만 펼치기
			}
		}
		
		setShowAllNode(value, text) {
			this._showAllNode = value;
			this._showAllNodeText = text || 'All';

			const binding = this.dataBinding;
			if (binding && binding.state === 'success') {
				this._lastTreeData = buildHierarchyFromSAC(binding);
			}

			if (!this._lastTreeData) return;
			if (!this._ui5Model) return;

			const finalData = value
				? [{ id: 'ALL', text: this._showAllNodeText, selected: false, children: this._lastTreeData }]
				: this._lastTreeData;
			
			this._ui5Model.setData({ nodes: finalData });
		}
		
		_applyFontStyle () {
			if (!this._fontStyleEl) return;

			const fontFamily = this._treeFontFamily || 'Arial, sans-serif';
			const fontSize   = (this._treeFontSize || 13) + 'px';
			const fontWeight = this._treeFontBold ? 'bold' : 'normal';
			const fontColor  = this._treeFontColor || '#32363a';

			this._fontStyleEl.textContent =
				'.' + this._widgetUid + ' .sapMTreeItemBaseDescription,' +
				'.' + this._widgetUid + ' .sapMTreeItemBase,' +
				'.' + this._widgetUid + ' .sapMSLITitle,' +
				'.' + this._widgetUid + ' .sapMSF input,' +
				'.' + this._widgetUid + ' .sapMSFI {' +
				'  font-family:' + fontFamily + ' !important;' +
				'  font-size:' + fontSize + ' !important;' +
				'  font-weight:' + fontWeight + ' !important;' +
				'  color:' + fontColor + ' !important;' +
				'}';
		}
	}
	
  
	// <1> 위젯 등록 : 태그발견시 Main Class실행 명령
	customElements.define('com-sap-sac-hierarchy-jjung-main', Main);
})();
