#!/usr/bin/env python3
"""Offline regression tests for CG-MASTER V151. No network; fixture deliberately tiny."""
import importlib.util
import json
import pathlib
import tempfile
import types
import unittest
from unittest.mock import patch

SCRIPT=pathlib.Path(__file__).with_name("fetch_kaikki_word_ipa_v151.py")
spec=importlib.util.spec_from_file_location("cgmaster_v151",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def card(n,word):
    return {"record_id":f"src-{n}","source_final_row":n,"scene_id":"SC50-0014",
        "question_page":{"english_expression":word,"cue_zh":"释义","ipa":None,"content_complete":False},
        "answer_page":{"meaning_zh":"释义","example_en":"Sentence.","example_zh":"例句。","collocations":["a","b"],"usage_note":"note","content_complete":True},
        "canonical_sense_id":None,"release_allowed":False}

class TestV151(unittest.TestCase):
    def test_exact_url_and_compound(self):
        self.assertEqual(module.source_url("pet"),"https://kaikki.org/dictionary/English/meaning/p/pe/pet.jsonl")
        self.assertEqual(module.source_url("pet owner"),"https://kaikki.org/dictionary/English/meaning/p/pe/pet%20owner.jsonl")
    def test_real_jsonl_parser_with_stubbed_http(self):
        data=b'{"word":"pet","lang_code":"en","pos":"noun","sounds":[{"ipa":"/p\\u025bt/","tags":["General American"]}]}' + b"\n"
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):return False
            def read(self,*a):return data
        with tempfile.TemporaryDirectory() as td:
            with patch.object(module.urllib.request,"urlopen",return_value=Response()):
                out=module.get_raw("pet",pathlib.Path(td),0)
            self.assertEqual(out["status"],"FETCHED")
            self.assertEqual(out["native_ipa_candidates"][0]["ipa"],"/pɛt/")
            self.assertEqual(out["native_ipa_candidates"][0]["tags"],["General American"])
            self.assertEqual(len(out["sha256"]),64)
    def test_overlay_never_certifies_or_changes_answer(self):
        with tempfile.TemporaryDirectory() as td:
            tmp=pathlib.Path(td)
            inp=tmp/"source.json";inp.write_text(json.dumps({"records":[card(1,"pet"),card(2,"dog"),card(3,"absent")]}))
            def fake_fetch(word,*args):
                if word=="pet":
                    variants=[{"ipa":"/pɛt/","pos":"noun","tags":[]}]
                elif word=="dog":
                    variants=[{"ipa":"/dɒɡ/","pos":"noun","tags":["UK"]},{"ipa":"/dɑɡ/","pos":"noun","tags":["US"]}]
                else:variants=[]
                return {"word":word,"url":module.source_url(word),"sha256":"e"*64,"status":"FETCHED","native_ipa_candidates":variants}
            with patch.object(module,"get_raw",side_effect=fake_fetch):
                module.build(types.SimpleNamespace(cards=inp,out_dir=tmp/"out",cache_dir=None,workers=2,retries=0))
            doc=json.loads((tmp/"out/CGMASTER_V151_QUESTION_IPA_TEST_OVERLAY.json").read_text())
            records=doc["records"]
            self.assertEqual(records[0]["question_page"]["ipa"],"/pɛt/")
            self.assertIsNone(records[1]["question_page"]["ipa"])
            self.assertEqual(len(records[1]["question_page"]["ipa_candidates_raw"]),2)
            self.assertIsNone(records[2]["question_page"]["ipa"])
            self.assertTrue(all(r["release_allowed"] is False for r in records))
            self.assertTrue(all(r["canonical_sense_id"] is None for r in records))
            self.assertEqual(records[0]["answer_page"],card(1,"pet")["answer_page"])
if __name__=="__main__":unittest.main()
