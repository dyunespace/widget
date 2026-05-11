(function () {

  class Main extends HTMLElement {
    constructor () {
      super()
    }

    connectedCallback () {
      this.style.display = 'block'
      this.style.width   = '100%'
      this.style.height  = '100%'

      this.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          background: yellow;
          color: red;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ✅ Shadow DOM 없이 로드 성공!
        </div>
      `
    }

    onCustomWidgetResize (width, height) {}
    onCustomWidgetAfterUpdate (changedProps) {}
    onCustomWidgetDestroy () {}

    async render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') return
    }
  }

  customElements.define('com-sap-sac-hierarchy-jjung-main', Main)
})()
