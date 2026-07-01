(function () {
	console.log("Custom Tree : Main 20260626_13:42");
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
			'sap/m/Button',
			'sap/m/SearchField',
			'sap/m/VBox',
			'sap/m/HBox',              // 🌟 [추가] 가로 배치 박스
			'sap/m/FlexItemData'       // 🌟 [추가] 자동 길이 조절 마법사
			// 🌟 주의: function 괄호 안의 이름들도 순서대로 맞춰주세요!
			], function (Tree, StandardTreeItem, JSONModel, Button, SearchField, VBox, HBox, FlexItemData) {
			
			// 🌟 1. [좀비 방어막] 라이브러리 다운로드 중에 SAC가 위젯을 껐다면, 화면 생성을 즉시 중단!
			if (!instance._built) return; 

			// 🌟 2. [메모리 청소] 혹시라도 기존에 연결되어 있던 VBox가 있다면 완벽히 파괴!
			if (instance._ui5VBox) {
				try { instance._ui5VBox.destroy(); } catch (e) {}
				instance._ui5VBox = null;
			}

			// 🌟 3. [물리적 청소] 컨테이너 안에 스타일 태그(<style>) 빼고 남아있는 모든 좀비 DOM 강제 소각!
			Array.from(container.children).forEach(child => {
				if (child.tagName !== 'STYLE') {
					container.removeChild(child);
				}
			});			
			
			// 초기엔 빈 데이터로 시작
			const oModel = new JSONModel({ nodes: [] });

			const oTree = new Tree({
				mode: 'MultiSelect', 
				includeItemInSelection: true,
				width: '100%',
				// 🌟 [여기에 추가!!] UI5가 내부적으로 렌더링을 완벽하게 끝냈을 때 딱 한 번만 실행됨
				updateFinished: function () {
					if (instance._needsExpansion) {
						oTree.collapseAll();
						oTree.expandToLevel(instance._defaultExpandLevel);
						instance._needsExpansion = false; // 볼일 끝났으니 신호 끄기
					}
				},
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

			// 🌟 1. 펼치기/접기 버튼 생성
			const btnExpand = new Button({
				icon: 'sap-icon://expand',
				tooltip: '모두 펼치기',
				visible: instance._showExpandCollapseBtn,
				press: function () { oTree.expandToLevel(99); }
			}).addStyleClass("sapUiTinyMarginBegin sacWhiteBtn"); // 👈 왼쪽 여백 살짝

			const btnCollapse = new Button({
				icon: 'sap-icon://collapse',
				tooltip: '모두 접기',
				visible: instance._showExpandCollapseBtn,
				press: function () { oTree.collapseAll(); }
			}).addStyleClass("sapUiTinyMarginBegin sacWhiteBtn");
			
			// 🌟 2. 검색창 생성 (FlexItemData가 핵심!)
			const oSearch = new SearchField({
				placeholder: '검색...',
				width: '100%',
				visible: instance._showSearchBox,
				layoutData: new FlexItemData({ growFactor: 1 }), // 👈 🌟 마법의 코드: 옆에 버튼이 없어지면 남는 공간을 모두 흡수해서 넓어집니다!
				liveChange: function (oEvent) {
					const q = oEvent.getParameter('newValue').toLowerCase().trim();
					const fullData = buildHierarchyFromSAC(instance.dataBinding);
					oModel.setData({ nodes: filterNodes(fullData, q) });
					if (q) oTree.expandToLevel(99);
				}
			});
			
			// 🌟 3. 가로 박스(HBox)에 검색창과 버튼 2개 나란히 꽂기
			const oTopBar = new HBox({
				width: '100%',
				alignItems: 'Center',
				visible: instance._showSearchBox || instance._showExpandCollapseBtn, // 둘 다 끄면 줄(Row) 전체를 숨김
				items: [oSearch, btnExpand, btnCollapse]
			}).addStyleClass("sapUiTinyMarginBottom"); // 👈 트리와 간격 살짝 띄우기

			const oVBox = new VBox({
				width: '100%',
				height: '100%',
				items: [oTopBar, oTree] // 🌟 기존 oToolbar 대신 oTopBar 하나만 넣습니다.
			});

			oVBox.placeAt(container);

			instance._ui5Model = oModel;
			instance._ui5Tree  = oTree;
			instance._ui5VBox  = oVBox;
			instance._oSearch = oSearch;
			instance._btnExpand = btnExpand;
			instance._btnCollapse = btnCollapse;
			instance._oTopBar = oTopBar;
			
			// 🌟 [호출 1] UI5 로딩이 무사히 끝났으니, 혹시 데이터 와있는지 확인하고 그려라!
			instance._refreshTreeData();
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
			this._treeRowPadding = 0; //0은 내부적으로 기본값
			this._fontStyleEl = null;
			this._widgetUid = 'hwid_' + Math.random().toString(36).slice(2);
			this._showSearchBox = true;           // 🌟 [추가] 검색창 기본값
			this._showExpandCollapseBtn = true;   // 🌟 [추가] 버튼 기본값
			// 🌟 [추가] 6대 테마 제어 변수 (기본값 세팅)
			this._rowBgColor = "";
			this._rowHoverBgColor = "";
			this._rowSelectedBgColor = "";
			this._itemArrowColor = "";
			this._itemCheckboxColor = "";
			this._showRowSeparator = false; // 기본값은 선 없음!
			this._rowSeparatorColor = "#dcdcdc";
			this._rowSeparatorThickness = 1;
			this._rowSeparatorStyle = "solid";
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
			if ('treeRowPadding' in changedProps) {
				this._treeRowPadding = changedProps.treeRowPadding;
			}
			// 🌟 [추가] 검색창/버튼 실시간 토글 로직
			if ('showSearchBox' in changedProps) {
				this._showSearchBox = changedProps.showSearchBox;
				if (this._oSearch) this._oSearch.setVisible(this._showSearchBox);
				this._updateTopBarVisibility();
			}
			if ('showExpandCollapseBtn' in changedProps) {
				this._showExpandCollapseBtn = changedProps.showExpandCollapseBtn;
				if (this._btnExpand && this._btnCollapse) {
					this._btnExpand.setVisible(this._showExpandCollapseBtn);
					this._btnCollapse.setVisible(this._showExpandCollapseBtn);
				}
				this._updateTopBarVisibility();
			}
			// 🌟 [추가] 스타일 패널에서 넘어오는 9가지 값 주머니에 담기
			if ('rowBgColor' in changedProps) this._rowBgColor = changedProps.rowBgColor;
			if ('rowHoverBgColor' in changedProps) this._rowHoverBgColor = changedProps.rowHoverBgColor;
			if ('rowSelectedBgColor' in changedProps) this._rowSelectedBgColor = changedProps.rowSelectedBgColor;
			if ('itemArrowColor' in changedProps) this._itemArrowColor = changedProps.itemArrowColor;
			if ('itemCheckboxColor' in changedProps) this._itemCheckboxColor = changedProps.itemCheckboxColor;
			if ('showRowSeparator' in changedProps) this._showRowSeparator = changedProps.showRowSeparator;
			if ('rowSeparatorColor' in changedProps) this._rowSeparatorColor = changedProps.rowSeparatorColor;
			if ('rowSeparatorThickness' in changedProps) this._rowSeparatorThickness = changedProps.rowSeparatorThickness;
			if ('rowSeparatorStyle' in changedProps) this._rowSeparatorStyle = changedProps.rowSeparatorStyle;
			
			this._applyFontStyle();

			// 🌟 [호출 2] SAC 본체에서 새로운 데이터나 설정이 도착했으니, 새로 그려라!
			this._refreshTreeData();
		}

		onCustomWidgetDestroy () {
			if (this._ui5VBox) {
				try { this._ui5VBox.destroy(); } catch (e) {}
			}
		}
		
		// 🌟 [추가] 타이밍 엇갈림을 방지하는 만능 데이터 주입기!
		_refreshTreeData() {
			if (this.dataBinding && this.dataBinding.state === 'success' && this.dataBinding.data) {
				this._lastTreeData = buildHierarchyFromSAC(this.dataBinding);
			}

			if (!this._lastTreeData || !this._ui5Model || !this._ui5Tree) return;

			const finalData = this._showAllNode
				? [{ id: 'ALL', text: this._showAllNodeText || 'All', selected: false, children: this._lastTreeData }]
				: this._lastTreeData;

			// 🌟 트리에게 "데이터 갱신했으니, 이따가 화면 다 그리면 펼쳐!" 라고 신호 보내기
			this._needsExpansion = true; 
			
			// 데이터 엎어치기
			this._ui5Model.setData({ nodes: finalData });
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
			
			// 패딩 값 가져오기 (0이면 순정 모드)
			const rowPaddingVal = this._treeRowPadding !== undefined ? this._treeRowPadding : 0;

			// 1. 기본 폰트 CSS 뭉치
			let cssText =
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

			// 🌟 2. 패딩 값이 0보다 클 때만 높이 조절 CSS를 슬쩍 추가!
			if (rowPaddingVal > 0) {
				cssText +=
					'.' + this._widgetUid + ' .sapMTreeItemBase {' +
					'  padding-top:' + rowPaddingVal + 'px !important;' +
					'  padding-bottom:' + rowPaddingVal + 'px !important;' +
					'  height: auto !important;' + 
					'}';
			}
			
			// 🌟 [추가/확장] 6대 시각 디자인 요소를 강제로 주입하는 핵심 CSS 엔진
			
			// 면 제어 (기본, 호버, 선택 배경색)
			if (this._rowBgColor) {
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase { background-color: ' + this._rowBgColor + ' !important; }';
			}
			if (this._rowHoverBgColor) {
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase:hover { background-color: ' + this._rowHoverBgColor + ' !important; }';
			}
			if (this._rowSelectedBgColor) {
				// 🌟 [수정된 부분] UI5의 진짜 선택 상태 클래스인 sapMLIBSelected 로 변경!
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase.sapMLIBSelected { background-color: ' + this._rowSelectedBgColor + ' !important; }';
				
				// 🌟 [보너스] 선택된 행 위에 마우스를 올렸을 때 색이 날아가지 않도록 방어하는 코드 추가
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase.sapMLIBSelected:hover { background-color: ' + this._rowSelectedBgColor + ' !important; }';
			}

			// 선 및 아이콘 제어 (화살표, 체크박스)
			// 선 및 아이콘 제어 (화살표, 체크박스)
			if (this._itemArrowColor) {
				// 🌟 [수정] 화살표 껍데기, 내부 아이콘, 가짜 요소(::before)까지 3단 콤보로 싹 다 갈색으로 덮어버립니다!
				cssText += 
					'.' + this._widgetUid + ' .sapMTreeItemBaseExpander, ' +
					'.' + this._widgetUid + ' .sapMTreeItemBaseExpander .sapUiIcon, ' +
					'.' + this._widgetUid + ' .sapMTreeItemBaseExpander::before { ' +
					'color: ' + this._itemArrowColor + ' !important; }';
			}
			if (this._itemCheckboxColor) {
				cssText += '.' + this._widgetUid + ' .sapMCbBg { border-color: ' + this._itemCheckboxColor + ' !important; color: ' + this._itemCheckboxColor + ' !important; }';
			}

			// 행 구분선 제어 (스위치가 켜졌을 때만 그리고, 꺼지면 아예 선을 투명화시킴)
			if (this._showRowSeparator) {
				const thick = this._rowSeparatorThickness !== undefined ? this._rowSeparatorThickness : 1;
				const style = this._rowSeparatorStyle || 'solid';
				const color = this._rowSeparatorColor || '#dcdcdc';
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase { border-bottom: ' + thick + 'px ' + style + ' ' + color + ' !important; }';
			} else {
				cssText += '.' + this._widgetUid + ' .sapMTreeItemBase { border-bottom: none !important; }';
			}
			// 🌟 [여기에 추가] 버튼 배경색을 강제로 하얗게 칠하는 CSS 규칙 얹기
			cssText +=
				'.' + this._widgetUid + ' .sacWhiteBtn .sapMBtnInner {' +
				'  background-color: #ffffff !important;' +  // 배경색 하양
				'  background-image: none !important;' +     // UI5 순정 입체감 그라데이션 제거
				'  border: 1px solid #dcdcdc !important;' +  // 검색창 테두리와 어울리는 은은한 선 추가
				'}';

			// 브라우저에 빵 쏘기
			this._fontStyleEl.textContent = cssText;
		}
		
		// 🌟 [추가] 검색창과 버튼 둘 다 꺼지면 아예 빈 줄 공간 자체를 지워버리는 함수
		_updateTopBarVisibility() {
			if (this._oTopBar) {
				this._oTopBar.setVisible(this._showSearchBox || this._showExpandCollapseBtn);
			}
		}
	}
	
  
	// <1> 위젯 등록 : 태그발견시 Main Class실행 명령
	customElements.define('com-sap-sac-hierarchy-jjung-main', Main);
})();
