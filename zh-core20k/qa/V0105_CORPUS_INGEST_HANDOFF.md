# 中文Core20K V0.10.5 跨领域语料导入工作集

实际源文件与可执行脚本保存在 ChatGPT Library：
`/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/v0105-ingest_corpus_frequency.py`
`/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/v0105-README.md`

脚本 SHA-256: `5c2c60d3ff0ec238b0606d6993c575451b600bde547a256bf8878a824cfd5db9`
README SHA-256: `67cfc216866ecb545e90a4edab11fefc92eac2d64f0c4ddd07c99cac3a254dee`

真实20,000词主表结构校验通过；合成词频文件正向测试通过（3/20,000匹配），缺失计数字段负向测试正确阻断。**合成数据不得作为真实词频证据。**

BCC 2.0官方说明跨领域字词频可下载：https://bcc.blcu.edu.cn/help.html 。当前执行环境未成功下载原始BCC频次，因此 **BCC真实词频交叉验证尚未完成**。本批没有修改词库、term_id、Scene500 Runtime，也没有宣布production_ready。
