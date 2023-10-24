class OgdenQuiz extends HTMLElement {
  // Specify observed attributes so that
  // attributeChangedCallback will work
  static get observedAttributes() {
    return [];
  }

  constructor(uid, anetAccount, token, options = {}) {
    // Always call super first in constructor
    super();
    if (!uid || !anetAccount || !token) {
      return console.error('An UID, an account and a token are required');
    }

    this.uid = uid;
    this.anetAccount = anetAccount;
    this.token = token;

    this.shadow = this.attachShadow({mode: 'open'});
    this.shadow.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      header {
        position: relative;
        border-bottom: 1px solid grey;
      }

      header .close {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 32px;
        cursor: pointer;
        font-weight: bold;
        opacity: .7;
      }

      header .close:hover {
        opacity: 1;
      }

      footer {
        border-top: 1px solid grey;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: .9em;
      }
      
      footer img {
        vertical-align: middle;
      }

      :host {
        position: fixed;
        bottom: 0;
        right: 5%;
        max-width: 80vw;
        border: 1px black solid;
        box-shadow: 0 0 20px -10px black;
        transform: translateY(100%);
        transition: .3s ease-in-out;
        background: rgba(255, 255, 255, .92);
        border-top-left-radius: 24px 16px;
        border-top-right-radius: 24px 16px;
      }
      
      :host:before {
        position: absolute;
        content: ' ';
        background-image: url('https://widget.gw2trivia.com/ogden.png');
        height: 150px;
        width: 150px;
        top: 0;
        right: 40px;
        transform: translateY(-55%);
      }

      .notification {
        position: absolute;
        border-radius: 40px;
        padding: 8px 16px;
        text-align: center;
        top: -95px;
        right: 145px;
        box-shadow: 0 1px black;
        font-weight: bold;
        background: rgba(255, 255, 255, .92);
      }

      .notification:not([hidden]) {
        display: inline-block;
      }

      main, header, footer {
        padding: .75rem 1.5rem;
      }

      header {
        padding-top: 1rem;
      }

      footer {
        padding-top: .2rem;
        padding-bottom: .2rem;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: .2em 0;
      }

      input[type=text] {
        padding: .5rem 1rem;
        border-radius: .25rem;
        width: 100%;
      }

      input[type=submit] {
        display: block;
        margin: .8rem auto;
      }

      .btn {
        padding: .5rem 1rem;
        border-radius: 9999px;
        background: var(--primary-color) !important;
        transition: all .3s ease;
        color: white;
        border: none;
      }

      .btn:hover {
        background: var(--secondary-color) !important;
      }

      :host(.open) {
        transform: translateY(0);
      }

      :host(:hover:not(.open)) {
        transform: translateY(95%);
        cursor: pointer;
      }

      .success {
        color: green;
      }

      .fail {
        color: red;
      }

      .floating {  
        animation-name: floating;
        animation-duration: 3s;
        animation-iteration-count: infinite;
        animation-timing-function: ease-in-out;
      }

      @keyframes floating {
        0% { transform: translate(0,  0px); }
        50%  { transform: translate(0, 12px); }
        100%   { transform: translate(0, -0px); }    
      }

      @media (max-width: 500px) {
        :host {
          right: 0;
          max-width: 100vw;
        }

        main, header, footer {
          padding-right: 1rem;
          padding-left: 1rem;
        }
      }

      @media (max-height: 500px) {
        main, header {
          padding-top: .5rem;
          padding-bottom: .5rem;
        }

        p {
          margin-block-start: .5em;
          margin-block-end: .5em;
        }
      }
    </style>
    <aside class="notification floating" hidden>!</aside>
    <header>
      <h1>Questions pour un présent</h1>
      <div class="close">X</div>
    </header>
    <main>
      <div class="already" hidden>
        Vous avez déjà participé aujourd'hui. Revenez demain pour une nouvelle question !
      </div>
      <div class="not-already" hidden>
        <p>Répondez à la question du jour d'Ogden pour gagner des points.</p>
        <p><strong><a id="question-title" href="https://gw2trivia.com/questions/view/2626/seul-au-milieu-des-vastes-etendues-desolees-je-veille-sur-les-secrets-dissimules-par-les-millenaires-qui-suis-je" target="_blank">Seul au milieu des vastes étendues désolées, je veille sur les secrets dissimulés par les millénaires. Qui suis-je ? </a></strong></p>
        <form action="#" method="post">
          <input type="text" id="answer" name="answer" placeholder="Votre réponse" required/>
          <input type="submit" class="btn"/>
        </form>
      </div>
      <div class="success" hidden>Vous avez trouvé la bonne réponse ! Revenez demain pour une nouvelle question.</div>
      <div class="fail" hidden>Ce n'est pas la réponse attendue.</div>
      <div class="error"></div>
    </main>
    <footer>
      <div>Plus de questions sur <a href="https://discord.gg/PDXyUjtahe" rel="noreferrer" target="_blank"><img title="Discord de Questions pour un Quaggan" src="https://img.icons8.com/color/344/discord-new-logo.png" width="24" height="24"/></a> - <a href="https://gw2trivia.com" rel="noreferrer" target="_blank"><img title="Site de GW2Trivia" src="https://gw2trivia.com/img/icon_64.png" width="24" height="24"/></a></div>
      <div>Ogden de <a href="https://twitter.com/Liliebia" title="Twitter de Liliebia" rel="noreferrer" target="_blank">Liliebia</a></div>
    </footer>
    `;

    if (options) {
      Object.assign(this, options);
    }

    this.addEventListener('click', () => {
      this.classList.add('open');
      this.shadow.querySelector('.notification').hidden = true;
    });

    this.shadow.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.classList.remove('open');
    });
  }

  /*
   * Method to check if this account has already participated today
   */
  checkAccount() {
    console.debug('Checking account');
    return fetch('https://widget.gw2trivia.com/check_account', {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account: this.anetAccount
      })
    })
		.then(response => response.json())
    .then(response => {
      console.debug(response);
      if (response.error) {
        return Object.assign(this.shadow.querySelector('.error'), {
          hidden: false,
          innerText: response.error
        });
      }
      return response.data;
    })
    .catch(err => console.error(JSON.stringify(err)));
  }

  fetchQuestion() {
    console.debug('Fetching question of the day');
    fetch('https://widget.gw2trivia.com/question_of_the_day', {
      method: "get",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
		.then(response => response.json())
    .then(response => {
      console.debug(response);
      const titleEl = this.shadow.getElementById('question-title');

      if (response.error) {
        return Object.assign(this.shadow.querySelector('.error'), {
          hidden: false,
          innerText: response.error
        });
      }

      const { external_id, title } = response.data;
      this.question_id = external_id;
      Object.assign(titleEl, {
        href: `https://gw2trivia.com/questions/view/${this.question_id}/calendar`,
        innerText: title
      });
      this.shadow.querySelector('.not-already').hidden = false;
      this.shadow.querySelector('.notification').hidden = false;
    })
    .catch(err => console.error(JSON.stringify(err)));
  }

  checkAnswer(answer) {
    console.debug('Checking answer');
    return fetch('https://widget.gw2trivia.com/check_answer', {
      method: "post",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: this.uid,
        account: this.anetAccount,
        token: this.token,
        answer
      })
    })
		.then(response => response.json())
    .then(response => {
      console.debug(response);

      if (response.error) {
        Object.assign(this.shadow.querySelector('.error'), {
          hidden: false,
          innerText: response.error
        });
      }

      return response.data;
    })
    .catch(err => console.error(JSON.stringify(err)));
  }

  async main() {
    if (await this.checkAccount()) {
      // already participated
      this.shadow.querySelector('.already').hidden = false;
      return;
    }
    this.fetchQuestion();
    const formEl = this.shadow.querySelector('form');
    formEl.addEventListener('submit', async e => {
      e.preventDefault();

      this.shadow.querySelector('.success').hidden = true;
      this.shadow.querySelector('.fail').hidden = true;
      this.shadow.querySelector('.error').hidden = true;

      const result = await this.checkAnswer(this.shadow.getElementById('answer').value);

      if (result === false) {
        this.shadow.querySelector('.fail').hidden = false;
      } else if (result) {
        this.shadow.querySelector('.success').hidden = false;
        formEl.hidden = true;
      }

      return false;
    })
  }

  connectedCallback() {
    this.main();
  }

  disconnectedCallback() {
    console.log('Custom square element removed from page.');
  }

  adoptedCallback() {
    console.log('Custom square element moved to new page.');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('Custom square element attributes changed.');
  }
}

customElements.define('ogden-quiz', OgdenQuiz);