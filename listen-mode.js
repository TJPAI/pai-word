// Listening-only mode: hide written prompt until reveal and add a settings toggle.
(function(){
  state.hideWord=state.hideWord===true;

  window.toggleHideWord=function(){
    state.hideWord=!state.hideWord;
    save();
    render();
  };

  function enhance(){
    const app=document.getElementById('app');
    if(!app)return;

    // Before reveal, listening mode shows no headword or IPA; audio still auto-plays
    // through the existing scene/review flow, and the speaker remains available to replay.
    const hero=app.querySelector('.word-hero');
    if(hero){
      hero.classList.toggle('listen-only',!!state.hideWord&&!state.revealed);
    }

    if(state.view==='settings'){
      const firstBlock=app.querySelector('.panel-block');
      if(firstBlock&&!firstBlock.querySelector('[data-hide-word-setting]')){
        const row=document.createElement('div');
        row.className='setting-row';
        row.setAttribute('data-hide-word-setting','');
        row.innerHTML=`<span>隐藏单词（听音模式）</span><button class="switch ${state.hideWord?'on':''}" onclick="toggleHideWord()"><i></i></button>`;
        firstBlock.appendChild(row);
      }
    }
  }

  const baseRender=render;
  render=function(){
    baseRender();
    enhance();
  };

  enhance();
})();
