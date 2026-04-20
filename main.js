(function () {
  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      :host { display: block; font-family: sans-serif; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
      .tree-node { margin-left: 20px; border-left: 1px dashed #ccc; padding-left: 10px; }
      .parent { font-weight: bold; color: #1a73e8; cursor: pointer; padding: 5px 0; }
      .child { color: #555; padding: 3px 0; font-size: 0.9em; }
      .folder-icon { margin-right: 5px; }
      .amount { float: right; color: #333; font-weight: normal; }
    </style>
    <div id="tree_root">
      <h3 style="border-bottom: 2px solid #1a73e8; padding-bottom: 5px;">🌳 계층 구조 테스트 (No Library)</h3>
      <div id="content"></div>
    </div>
  `

  class Main extends HTMLElement {
    constructor() {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._container = this._shadowRoot.getElementById('content')
    }

    connectedCallback() {
      this.renderStaticTree()
    }

    onCustomWidgetAfterUpdate(changedProps) {
      this.renderStaticTree()
    }

    renderStaticTree() {
      // 매뉴얼 데이터 (2단계)
      const data = [
        {
          name: "1. 본부 (Headquarters)",
          amount: "₩500,000",
          children: ["1-1. 영업팀 (Sales)", "1-2. 마케팅팀 (Marketing)"]
        },
        {
          name: "2. 제조센터 (Factory)",
          amount: "₩800,000",
          children: ["2-1. 생산1라인", "2-2. 품질관리팀"]
        }
      ];

      this._container.innerHTML = data.map(parent => `
        <div class="tree-node">
          <div class="parent">
            <span class="folder-icon">📂</span>${parent.name}
            <span class="amount">${parent.amount}</span>
          </div>
          ${parent.children.map(child => `
            <div class="tree-node child">
              <span class="folder-icon">📄</span>${child}
            </div>
          `).join('')}
        </div>
      `).join('');
    }
  }

  // 즉시 정의 (타임아웃 방지)
  customElements.define('com-sap-sac-exercise-dyunespace-v1-main', Main)
})()
