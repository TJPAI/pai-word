const fs=require('fs');
const files=['daily.js','app-runtime.js','ku-content-ui.js','tap-flow.js','scene-review.js','learning-app.js'];
const review=JSON.parse(fs.readFileSync('data/scene-ku-review-v1.json','utf8'));
fs.writeFileSync('learning-runtime.js','// SOURCE: data/scene-ku-review-v1.json\nwindow.PAI_SCENE_REVIEW_DATA='+JSON.stringify(review)+';\n'+files.map(f=>'// SOURCE: '+f+'\n'+fs.readFileSync(f,'utf8')).join('\n;\n'));
