(function () {
	const template = document.createElement('template');
	template.innerHTML = `
	<style>
		.row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px;
			font-family: Arial, sans-serif;
			font-size: 13px;
		}
		.row input[type="text"] {
			flex: 1;
			min-width: 0;
			padding: 4px 6px;
			box-sizing: border-box;
		}
		.row label {
			white-space: nowrap;
		}
    </style>
	<div class="row">
		<input type="checkbox" id="chk_showAll" />
		<label for="chk_showAll">Show ALL node</label>
	</div>
	<div class="row">
		<label for="txt_showAllText">노드 텍스트</label>
		<input type="text" id="txt_showAllText" placeholder="All" />
	</div>
	<div class="row">
		<label for="sel_defaultLevel">Default Level</label>
		<select id="sel_defaultLevel">
			<option value="0">0</option>
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
			<option value="5">5</option>
			<option value="99">전체</option>
		</select>
	</div>
		<div class="row">
		<label for="sel_fontFamily">폰트</label>
		<select id="sel_fontFamily">
			<option value="Arial, sans-serif">Arial</option>
			<option value="'Malgun Gothic', sans-serif">맑은 고딕</option>
			<option value="'72', '72full', Arial, sans-serif">72 (SAP)</option>
			<option value="Georgia, serif">Georgia</option>
			<option value="'Courier New', monospace">Courier New</option>
		</select>
	</div>
	<div class="row">
		<label for="num_fontSize">글자 크기</label>
		<input type="number" id="num_fontSize" min="8" max="40" step="1" />
	</div>
	<div class="row">
		<input type="checkbox" id="chk_fontBold" />
		<label for="chk_fontBold">굵게</label>
	</div>
	<div class="row">
		<label for="color_fontColor">글자 색상</label>
		<input type="color" id="color_fontColor" />
	</div>
  `;

  class Styling extends HTMLElement {
    constructor () {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		this._shadowRoot.appendChild(template.content.cloneNode(true));

		this._chkShowAll = this._shadowRoot.getElementById('chk_showAll');
		this._txtShowAllText = this._shadowRoot.getElementById('txt_showAllText');
		this._selDefaultLevel = this._shadowRoot.getElementById('sel_defaultLevel');
		
		this._selFontFamily = this._shadowRoot.getElementById('sel_fontFamily');
		this._numFontSize = this._shadowRoot.getElementById('num_fontSize');
		this._chkFontBold = this._shadowRoot.getElementById('chk_fontBold');
		this._colorFontColor = this._shadowRoot.getElementById('color_fontColor');

		this._fireChange = () => {
			this.dispatchEvent(new CustomEvent('propertiesChanged', {
				detail: {
					properties: {
						showAllNode: this._chkShowAll.checked,
						showAllNodeText: this._txtShowAllText.value || 'All',
						defaultExpandLevel: parseInt(this._selDefaultLevel.value, 10),
						treeFontFamily: this._selFontFamily.value,
						treeFontSize: parseInt(this._numFontSize.value, 10) || 13,
						treeFontBold: this._chkFontBold.checked,
						treeFontColor: this._colorFontColor.value
					}
				},
				bubbles: true,
				composed: true
			}));
		};

		this._chkShowAll.addEventListener('change', this._fireChange);
		this._txtShowAllText.addEventListener('change', this._fireChange);
		this._selDefaultLevel.addEventListener('change', this._fireChange);
		this._selFontFamily.addEventListener('change', this._fireChange);
		this._numFontSize.addEventListener('change', this._fireChange);
		this._chkFontBold.addEventListener('change', this._fireChange);
		this._colorFontColor.addEventListener('change', this._fireChange);
    }

    onCustomWidgetAfterUpdate (changedProps) {
		if ('showAllNode' in changedProps) {
			this._chkShowAll.checked = changedProps.showAllNode;
		}
		if ('showAllNodeText' in changedProps) {
			this._txtShowAllText.value = changedProps.showAllNodeText;
		}
		if ('defaultExpandLevel' in changedProps) {
			this._selDefaultLevel.value = String(changedProps.defaultExpandLevel);
		}
		if ('treeFontFamily' in changedProps) {
			this._selFontFamily.value = changedProps.treeFontFamily;
		}
		if ('treeFontSize' in changedProps) {
			this._numFontSize.value = changedProps.treeFontSize;
		}
		if ('treeFontBold' in changedProps) {
			this._chkFontBold.checked = changedProps.treeFontBold;
		}
		if ('treeFontColor' in changedProps) {
			this._colorFontColor.value = changedProps.treeFontColor;
		}
    }
}

	customElements.define('com-sap-sac-hierarchy-jjung-styling', Styling);
})();
