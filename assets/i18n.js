let translationDictionary = {
    "#id-input": {
        prop: "placeholder",
        values: {
            ar: "رقم السبورة",
            fr: "Numéro du Pad",
            en: "Pad",
        }
    }
}

let switchRightAndLeftCss = document.createElement('style');
switchRightAndLeftCss.innerHTML = `:root {
    --left-direction: right;
    --right-direction: left;
}`;

let translate = (langId, isRTL = false) => {
    if (isRTL){
        document.body.parentNode.setAttribute('dir', 'rtl')
        //FIXME: I'm not working
        document.head.appendChild(switchRightAndLeftCss)
    }else{
        document.body.parentNode.removeAttribute('dir')
        if(document.getElementById('customRightToLeftCss') !== null)
            document.head.removeChild(switchRightAndLeftCss)
    }

    document.body.parentNode.setAttribute('lang', langId)
    for (var i in translationDictionary) {
        try{
            var elements = document.querySelectorAll(i);
            for (var j in elements) {
                try{
                    if(translationDictionary[i] === undefined){
                        console.warn(`No langage index ${langId} found for ${elements[j]} falling back to english`)
                    }
                    if(j == 'html'){
                        elements[j].innerHTML = translationDictionary[i].values[langId | 'en']
                    }
                    elements[j].setAttribute(translationDictionary[i].prop, translationDictionary[i].values[langId | 'en'])
                }catch(e){}
            }
        }catch(e){}
    }
}

//translate('en')