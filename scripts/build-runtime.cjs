const fs=require('fs');fs.writeFileSync('learning-runtime.js',['daily.js','app-runtime.js','ku-content-ui.js','learning-app.js'].map(f=>'// SOURCE: '+f+'\n'+fs.readFileSync(f,'utf8')).join('\n;\n'));
