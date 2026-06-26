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
  `;

  class Styling extends HTMLElement {
    constructor () {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		this._shadowRoot.appendChild(template.content.cloneNode(true));

		this._chkShowAll = this._shadowRoot.getElementById('chk_showAll');
		this._txtShowAllText = this._shadowRoot.getElementById('txt_showAllText');
		this._selDefaultLevel = this._shadowRoot.getElementById('sel_defaultLevel');

		this._fireChange = () => {
			this.dispatchEvent(new CustomEvent('propertiesChanged', {
				detail: {
					properties: {
						showAllNode: this._chkShowAll.checked,
						showAllNodeText: this._txtShowAllText.value || 'All',
						defaultExpandLevel: parseInt(this._selDefaultLevel.value, 10)
					}
				},
				bubbles: true,
				composed: true
			}));
		};

		this._chkShowAll.addEventListener('change', this._fireChange);
		this._txtShowAllText.addEventListener('change', this._fireChange);
		this._selDefaultLevel.addEventListener('change', this._fireChange);
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
    }
}

	customElements.define('com-sap-sac-hierarchy-jjung-styling', Styling);
})();
