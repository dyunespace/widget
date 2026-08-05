(function () {
	console.log("Custom Tree : Style 20260630_12:50");
	// ─── UI5 스타일링 패널 빌더 ──────────────────────────────
	function buildUI5Panel(container, instance) {
		sap.ui.require([
			"sap/ui/layout/form/SimpleForm",
			"sap/m/Label",
			"sap/m/Input",
			"sap/m/CheckBox",
			"sap/m/Select",
			"sap/ui/core/Item",
			"sap/m/StepInput",
			"sap/ui/core/HTML",
			"sap/m/HBox",         // 🌟 [추가] 가로로 묶어주는 박스
			"sap/ui/core/Icon",    // 🌟 [추가] 정보 아이콘
			"sap/m/Popover",      // 🌟 [추가] 꼭지 달린 말풍선
			"sap/m/Text"          // 🌟 [추가] 말풍선 안의 텍스트
		], function (SimpleForm, Label, Input, CheckBox, Select, Item, StepInput, HTML, HBox, Icon, Popover, Text) {
			
			// 🌟 [추가] 색상 피커 + 기본값 토글을 가로로 예쁘게 묶어주는 스마트 헬퍼 함수
			function createColorPropRow(propName, defaultHex) {
				const isDefault = !instance._props[propName];
				const colorVal = instance._props[propName] || defaultHex;

				const cp = new HTML({
					content: "<input type='color' value='" + colorVal + "' style='width:40px; height: 2rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;' " + (isDefault ? "disabled" : "") + ">",
					afterRendering: function () {
						const dom = this.getDomRef();
						if (dom) {
							dom.addEventListener('change', function (e) {
								instance.updateProp(propName, e.target.value);
							});
						}
					}
				});

				const cb = new CheckBox({
					text: "기본값 사용",
					selected: isDefault,
					select: function (oEvent) {
						const checked = oEvent.getParameter('selected');
						const dom = cp.getDomRef();
						if (checked) {
							instance.updateProp(propName, "");
							if (dom) dom.disabled = true;
						} else {
							const currentPickerVal = dom ? dom.value : defaultHex;
							instance.updateProp(propName, currentPickerVal);
							if (dom) dom.disabled = false;
						}
					}
				});

				const hbox = new HBox({
					alignItems: "Center",
					items: [cp, cb.addStyleClass("sapUiTinyMarginBegin")]
				});

				return { hbox: hbox, cp: cp, cb: cb };
			}

			// 1. Show ALL node (체크박스)
			const chkShowAll = new CheckBox({
				selected: instance._props.showAllNode || false,
				select: function (oEvent) {
					instance.updateProp('showAllNode', oEvent.getParameter('selected'));
					
					const bSelected = oEvent.getParameter('selected');
					instance.updateProp('showAllNode', bSelected);
					
					// 🌟 [추가] 체크 여부에 따라 노드 텍스트 라벨과 입력창 숨김/표시 처리
					lblShowAllText.setVisible(bSelected);
					txtShowAllText.setVisible(bSelected);
				}
			});
			
			// 2. 노드 텍스트 라벨 변수 분리 및 초기 visible 설정
			// ➕ [추가] 라벨을 변수로 생성하고 visible 속성 부여
			const lblShowAllText = new Label({ 
				text: "전체 노드 이름",
				visible: instance._props.showAllNode || false 
			});

			// 2. 노드 텍스트 (텍스트 입력)
			const txtShowAllText = new Input({
				value: instance._props.showAllNodeText || 'All',
				visible: instance._props.showAllNode || false, // 🌟 [추가] 초기 visible 설정
				change: function (oEvent) {
					instance.updateProp('showAllNodeText', oEvent.getParameter('value'));
				}
			});

			// 3. Default Level (드롭다운)
			const selDefaultLevel = new Select({
				selectedKey: String(instance._props.defaultExpandLevel || 1),
				items: [0, 1, 2, 3, 4, 5, 99].map(v => new Item({
					key: String(v),
					text: v === 99 ? '전체' : String(v)
				})),
				change: function (oEvent) {
					instance.updateProp('defaultExpandLevel', parseInt(oEvent.getParameter('selectedItem').getKey(), 10));
				}
			});

			// 4. 폰트 (드롭다운)
			const selFontFamily = new Select({
				selectedKey: instance._props.treeFontFamily || 'Arial, sans-serif',
				items: [
					new Item({ key: 'Arial, sans-serif', text: 'Arial' }),
					new Item({ key: "'Malgun Gothic', sans-serif", text: '맑은 고딕' }),
					new Item({ key: "'72', '72full', Arial, sans-serif", text: '72 (SAP)' }),
					new Item({ key: 'Georgia, serif', text: 'Georgia' }),
					new Item({ key: "'Courier New', monospace", text: 'Courier New' })
				],
				change: function (oEvent) {
					instance.updateProp('treeFontFamily', oEvent.getParameter('selectedItem').getKey());
				}
			});

			// 5. 글자 크기 (위아래 버튼이 있는 숫자 입력)
			const numFontSize = new StepInput({
				value: instance._props.treeFontSize || 13,
				min: 8, max: 40,
				change: function (oEvent) {
					instance.updateProp('treeFontSize', oEvent.getParameter('value'));
				}
			});

			// 6. 굵게 (체크박스)
			const chkFontBold = new CheckBox({
				selected: instance._props.treeFontBold || false,
				select: function (oEvent) {
					instance.updateProp('treeFontBold', oEvent.getParameter('selected'));
				}
			});

			// 7. 글자 색상 (UI5 환경에 최적화된 Native Color Picker 삽입)
			const colorHtml = "<input type='color' value='" + (instance._props.treeFontColor || '#000000') + "' style='width:100%; height: 2rem; border: 1px solid #ccc; padding: 2px; box-sizing: border-box; border-radius: 4px; cursor: pointer; background: white;'>";
			const colorInput = new HTML({
				content: colorHtml,
				afterRendering: function () {
					const domRef = this.getDomRef();
					if (domRef) {
						domRef.addEventListener('change', function (e) {
							instance.updateProp('treeFontColor', e.target.value);
						});
					}
				}
			});
			
			// 🌟 8. 노드 행 간격 (위아래 버튼이 있는 숫자 입력)
			const numRowPadding = new StepInput({
				value: instance._props.treeRowPadding !== undefined ? instance._props.treeRowPadding : 0,
				min: 0, max: 40,
				change: function (oEvent) {
					instance.updateProp('treeRowPadding', oEvent.getParameter('value'));
				}
			});

			// 🌟 8-1. SAC 스타일의 꼭지 달린 말풍선(Popover) 만들기
			const oInfoPopover = new Popover({
				showHeader: false, // 제목 표시줄 숨김
				placement: "Auto", // 공간에 맞춰 위나 아래로 꼬리가 생김
				content: [
					new Text({ 
						text: "0을 입력하면 기본 행 간격이 적용됩니다." 
					}).addStyleClass("sapUiSmallMargin") // 글자 주변에 여백을 줘서 답답하지 않게
				]
			});

			// 🌟 8-2. 아이콘 만들기 (순정 press 방식으로 원복)
			const infoIcon = new Icon({
				src: "sap-icon://message-information",
				size: "1rem",
				color: "#5b738b",
				press: function (oEvent) {
					// 👆 기본 방식: 마우스를 클릭하고 손을 뗄 때 팝오버가 열립니다.
					oInfoPopover.openBy(oEvent.getSource());
				}
			}).addStyleClass("sapUiTinyMarginBegin"); // UI5가 알아서 손가락 커서를 만들어 주므로 sapPointer는 뺐습니다.

			// 🌟 8-3. 마우스 이벤트 연결 (마우스를 치우면 닫힘)
			infoIcon.addEventDelegate({
				onmouseout: function () {
					// 마우스를 밖으로 빼면 서서히 사라집니다.
					oInfoPopover.close(); 
				}
			});

			// 🌟 8-4. 숫자 입력창과 아이콘 묶어주기
			const hboxRowPadding = new HBox({
				alignItems: "Center",
				items: [
					numRowPadding,
					infoIcon
				]
			});
			
			// 🌟 [수정] 뼈대를 부수지 않고 얌전하게 왼쪽 정렬만 시키는 안전한 CSS
			if (!document.getElementById("sac-custom-form-style")) {
				const styleEl = document.createElement("style");
				styleEl.id = "sac-custom-form-style";
				styleEl.textContent = `
					/* 1. 그리드를 유지한 채 라벨 글자만 왼쪽으로 정렬 */
					.sacLeftAlignForm .sapMLabel,
					.sacLeftAlignForm .sapUiFormElementLbl {
						text-align: left !important;
					}
					
					/* 2. 폼 자체의 불필요한 왼쪽 여백만 살짝 제거 */
					.sacLeftAlignForm.sapUiFormResGrid {
						padding-left: 0 !important;
						padding-right: 0 !important;
					}
				`;
				document.head.appendChild(styleEl);
			}
			
			// 🌟 [추가] 검색창 표시 여부
			const chkShowSearch = new CheckBox({
				selected: instance._props.showSearchBox !== false,
				select: function (oEvent) {
					instance.updateProp('showSearchBox', oEvent.getParameter('selected'));
				}
			});

			// 🌟 [추가] 버튼 표시 여부
			const chkShowBtns = new CheckBox({
				selected: instance._props.showExpandCollapseBtn !== false,
				select: function (oEvent) {
					instance.updateProp('showExpandCollapseBtn', oEvent.getParameter('selected'));
				}
			});
			
			// 🌟 6대 시각 디자인 컨트롤들 대량 생성!
			const rowBg = createColorPropRow('rowBgColor', '#ffffff');
			const rowHoverBg = createColorPropRow('rowHoverBgColor', '#f5f5f5');
			const rowSelectedBg = createColorPropRow('rowSelectedBgColor', '#e0f0ff');
			const itemArrow = createColorPropRow('itemArrowColor', '#5b738b');
			const itemCbColor = createColorPropRow('itemCheckboxColor', '#0070f2');
			const sepColor = createColorPropRow('rowSeparatorColor', '#dcdcdc');

			// 행 구분선 토글 스위치 (체크하면 하위 세부메뉴 싹 보임!)
			const chkShowSep = new CheckBox({
				selected: instance._props.showRowSeparator || false,
				select: function (oEvent) {
					const bSelected = oEvent.getParameter('selected');
					instance.updateProp('showRowSeparator', bSelected);
					
					lblSepColor.setVisible(bSelected);
					sepColor.hbox.setVisible(bSelected);
					lblSepThick.setVisible(bSelected);
					numSepThickness.setVisible(bSelected);
					lblSepStyle.setVisible(bSelected);
					selSepStyle.setVisible(bSelected);
				}
			});

			const lblSepColor = new Label({ text: "구분선 색상", visible: instance._props.showRowSeparator || false });
			const lblSepThick = new Label({ text: "구분선 두께(px)", visible: instance._props.showRowSeparator || false });
			const numSepThickness = new StepInput({
				value: instance._props.rowSeparatorThickness !== undefined ? instance._props.rowSeparatorThickness : 1,
				min: 1, max: 10,
				visible: instance._props.showRowSeparator || false,
				change: function (oEvent) {
					instance.updateProp('rowSeparatorThickness', oEvent.getParameter('value'));
				}
			});

			const lblSepStyle = new Label({ text: "구분선 스타일", visible: instance._props.showRowSeparator || false });
			const selSepStyle = new Select({
				selectedKey: instance._props.rowSeparatorStyle || 'solid',
				visible: instance._props.showRowSeparator || false,
				items: [
					new Item({ key: 'solid', text: '실선 (Solid)' }),
					new Item({ key: 'dashed', text: '파선 (Dashed)' }),
					new Item({ key: 'dotted', text: '점선 (Dotted)' }),
					new Item({ key: 'double', text: '겹선 (Double)' })
				],
				change: function (oEvent) {
					instance.updateProp('rowSeparatorStyle', oEvent.getParameter('selectedItem').getKey());
				}
			});
			
			// 🌟 SAP 기본 패널과 똑같은 레이아웃(SimpleForm)으로 묶기
			const oForm = new SimpleForm({
				editable: true,
				layout: "ResponsiveGridLayout",
				labelSpanXL: 4, labelSpanL: 4, labelSpanM: 4, labelSpanS: 5,
				emptySpanXL: 0, emptySpanL: 0, emptySpanM: 0, emptySpanS: 0,
				columnsXL: 1, columnsL: 1, columnsM: 1,
				content: [
					new Label({ text: "전체 노드 표시" }), chkShowAll,
					lblShowAllText, txtShowAllText,
					new Label({ text: "기본 표시 레벨" }), selDefaultLevel,
					new Label({ text: "폰트" }), selFontFamily,
					new Label({ text: "글자 크기" }), numFontSize,
					new Label({ text: "굵게" }), chkFontBold,
					new Label({ text: "글자 색상" }), colorInput,
					new Label({ text: "행 간격 (Padding)" }), hboxRowPadding,
					new Label({ text: "검색창 표시" }), chkShowSearch,      // 🌟 [추가]
					new Label({ text: "펼치기/접기 표시" }), chkShowBtns,     // 🌟 [추가]
					
					// 🌟 [추가] 오와 열이 완벽히 정렬되는 신규 커스텀 프로퍼티 폼 구성
					new Label({ text: "노드 기본 배경색" }), rowBg.hbox,
					new Label({ text: "노드 호버 배경색" }), rowHoverBg.hbox,
					new Label({ text: "노드 선택 배경색" }), rowSelectedBg.hbox,
					new Label({ text: "화살표 아이콘 색상" }), itemArrow.hbox,
					new Label({ text: "체크박스 색상" }), itemCbColor.hbox,
					new Label({ text: "행 구분선 표시" }), chkShowSep,
					lblSepColor, sepColor.hbox,
					lblSepThick, numSepThickness,
					lblSepStyle, selSepStyle
				]
			}).addStyleClass("sacLeftAlignForm"); // 👈 🌟 [여기에 추가!] 위에서 만든 스타일 이름을 달아줍니다.

			oForm.placeAt(container);

			// 나중에 값이 밖에서 바뀌면 화면을 갱신하기 위해 컨트롤들을 저장
			instance._ui5Controls = {
				chkShowAll: chkShowAll,
				txtShowAllText: txtShowAllText,
				selDefaultLevel: selDefaultLevel,
				selFontFamily: selFontFamily,
				numFontSize: numFontSize,
				chkFontBold: chkFontBold,
				colorInput: colorInput,
				numRowPadding: numRowPadding,
				chkShowSearch: chkShowSearch, // 🌟 [추가]
				chkShowBtns: chkShowBtns,     // 🌟 [추가]
				
				// 🌟 신규 부품 등록
				rowBgCp: rowBg.cp, rowBgCb: rowBg.cb,
				rowHoverBgCp: rowHoverBg.cp, rowHoverBgCb: rowHoverBg.cb,
				rowSelectedBgCp: rowSelectedBg.cp, rowSelectedBgCb: rowSelectedBg.cb,
				itemArrowCp: itemArrow.cp, itemArrowCb: itemArrow.cb,
				itemCbColorCp: itemCbColor.cp, itemCbColorCb: itemCbColor.cb,
				chkShowSep: chkShowSep,
				lblSepColor: lblSepColor, sepColorCp: sepColor.cp, sepColorCb: sepColor.cb, sepColorHbox: sepColor.hbox,
				lblSepThick: lblSepThick, numSepThickness: numSepThickness,
				lblSepStyle: lblSepStyle, selSepStyle: selSepStyle
			};
		});
	}

	// ─── Web Component ────────────────────────────────────────
	class Styling extends HTMLElement {
		constructor() {
			super();
			this._container = null;
			this._ui5Controls = null;
			this._props = {}; // 현재 속성값들 저장
		}

		connectedCallback() {
			// Shadow DOM 대신 Light DOM을 사용하여 UI5 팝업(드롭다운 등)이 짤리지 않게 함
			if (!this._container) {
				this._container = document.createElement('div');
				this._container.style.padding = '10px 0'; // 위아래 여백 살짝
				this.appendChild(this._container);

				if (window.sap && window.sap.ui && window.sap.ui.require) {
					buildUI5Panel(this._container, this);
				}
			}
		}

		// SAC 본체로 변경된 데이터 쏘기
		updateProp(name, value) {
			this._props[name] = value;
			this.dispatchEvent(new CustomEvent('propertiesChanged', {
				detail: { properties: { [name]: value } },
				bubbles: true,
				composed: true
			}));
		}

		// SAC 본체에서 초기값이나 변경된 값을 던져줄 때 실행됨
		onCustomWidgetAfterUpdate(changedProps) {
			Object.assign(this._props, changedProps); // 내부 변수 갱신

			// UI5 화면에 반영 (화면이 다 그려진 후라면)
			if (this._ui5Controls) {
				if ('showAllNode' in changedProps) this._ui5Controls.chkShowAll.setSelected(changedProps.showAllNode);
				if ('showAllNodeText' in changedProps) this._ui5Controls.txtShowAllText.setValue(changedProps.showAllNodeText);
				if ('defaultExpandLevel' in changedProps) this._ui5Controls.selDefaultLevel.setSelectedKey(String(changedProps.defaultExpandLevel));
				if ('treeFontFamily' in changedProps) this._ui5Controls.selFontFamily.setSelectedKey(changedProps.treeFontFamily);
				if ('treeFontSize' in changedProps) this._ui5Controls.numFontSize.setValue(changedProps.treeFontSize);
				if ('treeFontBold' in changedProps) this._ui5Controls.chkFontBold.setSelected(changedProps.treeFontBold);
				
				if ('treeFontColor' in changedProps) {
					const domRef = this._ui5Controls.colorInput.getDomRef();
					if (domRef) domRef.value = changedProps.treeFontColor;
				}
				// 🌟 [추가] 본체에서 값이 오면 패널 화면도 업데이트
				if ('treeRowPadding' in changedProps) {
					this._ui5Controls.numRowPadding.setValue(changedProps.treeRowPadding);
				}
				if ('showSearchBox' in changedProps) this._ui5Controls.chkShowSearch.setSelected(changedProps.showSearchBox);
				if ('showExpandCollapseBtn' in changedProps) this._ui5Controls.chkShowBtns.setSelected(changedProps.showExpandCollapseBtn);
				
				// 스마트 컬러 리프레시 유틸리티
				const refreshColorControl = (propName, cp, cb, defaultHex) => {
					if (propName in changedProps) {
						const val = changedProps[propName];
						cb.setSelected(!val);
						const dom = cp.getDomRef();
						if (dom) {
							dom.value = val || defaultHex;
							dom.disabled = !val;
						}
					}
				};

				refreshColorControl('rowBgColor', this._ui5Controls.rowBgCp, this._ui5Controls.rowBgCb, '#ffffff');
				refreshColorControl('rowHoverBgColor', this._ui5Controls.rowHoverBgCp, this._ui5Controls.rowHoverBgCb, '#f5f5f5');
				refreshColorControl('rowSelectedBgColor', this._ui5Controls.rowSelectedBgCp, this._ui5Controls.rowSelectedBgCb, '#e0f0ff');
				refreshColorControl('itemArrowColor', this._ui5Controls.itemArrowCp, this._ui5Controls.itemArrowCb, '#5b738b');
				refreshColorControl('itemCheckboxColor', this._ui5Controls.itemCbColorCp, this._ui5Controls.itemCbColorCb, '#0070f2');
				refreshColorControl('rowSeparatorColor', this._ui5Controls.sepColorCp, this._ui5Controls.sepColorCb, '#dcdcdc');

				if ('showRowSeparator' in changedProps) {
					const bVisible = !!changedProps.showRowSeparator;
					this._ui5Controls.chkShowSep.setSelected(bVisible);
					this._ui5Controls.lblSepColor.setVisible(bVisible);
					this._ui5Controls.sepColorHbox.setVisible(bVisible);
					this._ui5Controls.lblSepThick.setVisible(bVisible);
					this._ui5Controls.numSepThickness.setValue(this._props.rowSeparatorThickness || 1).setVisible(bVisible);
					this._ui5Controls.lblSepStyle.setVisible(bVisible);
					this._ui5Controls.selSepStyle.setSelectedKey(this._props.rowSeparatorStyle || 'solid').setVisible(bVisible);
				}
				if ('rowSeparatorThickness' in changedProps) this._ui5Controls.numSepThickness.setValue(changedProps.rowSeparatorThickness);
				if ('rowSeparatorStyle' in changedProps) this._ui5Controls.selSepStyle.setSelectedKey(changedProps.rowSeparatorStyle);
			}
		}
	}

	customElements.define('com-sap-sac-hierarchy-jjung-styling', Styling);
})();
