(function () {
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

			// 🌟 SAP 기본 패널과 똑같은 레이아웃(SimpleForm)으로 묶기
			const oForm = new SimpleForm({
				editable: true,
				layout: "ResponsiveGridLayout",
				labelSpanXL: 4, labelSpanL: 4, labelSpanM: 4, labelSpanS: 5,
				emptySpanXL: 0, emptySpanL: 0, emptySpanM: 0, emptySpanS: 0,
				columnsXL: 1, columnsL: 1, columnsM: 1,
				content: [
					new Label({ text: "Show ALL node" }), chkShowAll,
					lblShowAllText, txtShowAllText, // 🔄 [변경] 기존의 new Label(...)을 제거하고 변수명으로 대체
					new Label({ text: "Default Level" }), selDefaultLevel,
					new Label({ text: "폰트" }), selFontFamily,
					new Label({ text: "글자 크기" }), numFontSize,
					new Label({ text: "굵게" }), chkFontBold,
					new Label({ text: "글자 색상" }), colorInput,
					new Label({ text: "행 간격(Padding)" }), hboxRowPadding // 🌟 [변경] numRowPadding 대신 아이콘이 포함된 hboxRowPadding을 넣습니다!
				]
			});

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
				numRowPadding: numRowPadding // 🌟 [추가]
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
			}
		}
	}

	customElements.define('com-sap-sac-hierarchy-jjung-styling', Styling);
})();
