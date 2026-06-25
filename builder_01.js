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
    </style>
    <div class="row">
      <input type="checkbox" id="chk_showAll" />
      <label for="chk_showAll">Show ALL node</label>
    </div>
  `;

  class Builder extends HTMLElement {
    constructor () {
      super();
      this._shadowRoot = this.attachShadow({ mode: 'open' });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      this._chkShowAll = this._shadowRoot.getElementById('chk_showAll');

      this._chkShowAll.addEventListener('change', () => {
        this.dispatchEvent(new CustomEvent('propertiesChanged', {
          detail: { properties: { showAllNode: this._chkShowAll.checked } },
          bubbles: true,
          composed: true
        }));
      });
    }

    onCustomWidgetAfterUpdate (changedProps) {
      if ('showAllNode' in changedProps) {
        this._chkShowAll.checked = changedProps.showAllNode;
      }
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-builder', Builder);
})();