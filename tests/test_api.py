import os
import tempfile
import unittest
from unittest.mock import patch
os.environ['HEALTH_DISABLE_WORKER'] = '1'
os.environ['HEALTH_DB_PATH'] = ':memory:'
# init_db needs a persistent temporary path because API uses new connections.
_boot = tempfile.TemporaryDirectory()
os.environ['HEALTH_DB_PATH'] = _boot.name + '/boot.db'
import app as server
from notion_sync import NotionClient, NotionError
from notion_config import PROPERTIES

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        server.DB = self.tmp.name + '/test.db'
        server.init_db()
        self.client = server.app.test_client()
        self.entry = {'date': '2026-01-01', 'updatedAt': '2026-01-01T00:00:00Z', 'energy': 2, 'workHours': .5}
    def tearDown(self):
        self.tmp.cleanup()
    def test_offline_local_upsert_and_retry(self):
        with patch.object(server.notion, 'upsert', side_effect=NotionError('offline')):
            self.assertFalse(self.client.post('/api/health-log', json=self.entry).json['synced'])
            self.entry.update(energy=4, updatedAt='2026-01-01T00:00:01Z')
            self.client.post('/api/health-log', json=self.entry)
        result = self.client.get('/api/health-log').json
        self.assertEqual(len(result['entries']), 1)
        self.assertEqual(result['entries'][0]['energy'], 4)
        self.assertEqual(result['pending'], ['2026-01-01'])
        with patch.object(server.notion, 'upsert', return_value={'action': 'UPDATE', 'pageId': 'p'}) as mock:
            self.assertTrue(server.sync_date('2026-01-01')['synced'])
            mock.assert_called_once_with(self.entry)
        self.assertEqual(self.client.get('/api/health-log').json['pending'], [])
    def test_invalid_inputs_and_cross_origin(self):
        for change in [{'energy': 0}, {'workHours': .1}, {'date': '2026-02-30'}, {'steps': True}, {'mood': '2'}, {'updatedAt': 'garbage'}, {'extra': 1}, {'sleepHours': 25}]:
            self.assertEqual(self.client.post('/api/health-log', json={**self.entry, **change}).status_code, 400)
        self.assertEqual(self.client.post('/api/health-log', json=self.entry, headers={'Origin': 'https://evil.example'}).status_code, 403)
    def test_stale_request_cannot_overwrite_newer_data(self):
        with patch.object(server.notion, 'upsert', side_effect=NotionError('offline')):
            self.client.post('/api/health-log', json={**self.entry, 'updatedAt': '2026-01-01T00:00:02Z'})
            self.assertEqual(self.client.post('/api/health-log', json=self.entry).status_code, 409)
    def test_routes_do_not_expose_configuration(self):
        with self.client.get('/') as response:
            self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get('/.env.local').status_code, 404)
        self.assertEqual(self.client.get('/api/generate-dummy').status_code, 404)

class NotionTests(unittest.TestCase):
    def setUp(self):
        self.client = NotionClient()
        self.client.source_id = 'source'
        self.client.title_property = 'Name'
        self.entry = {'date': '2026-01-01', 'updatedAt': '2026-01-01T00:00:00Z', 'energy': 2}
    def test_create_then_update_same_day(self):
        records = []
        calls = []
        def api(method, path, payload=None):
            calls.append((method, path, payload))
            if path.endswith('/query'):
                self.assertEqual(payload['filter']['date']['equals'], self.entry['date'])
                return {'results': records.copy()}
            if path == 'pages':
                records.append({'id': 'same-page'})
            return {'id': 'same-page'}
        with patch.object(self.client, 'prepare'), patch.object(self.client, 'call', side_effect=api):
            self.assertEqual(self.client.upsert(self.entry)['action'], 'CREATE')
            self.entry['energy'] = 4
            self.assertEqual(self.client.upsert(self.entry)['action'], 'UPDATE')
        self.assertEqual(len(records), 1)
        self.assertEqual(calls[-1][0:2], ('PATCH', 'pages/same-page'))
        self.assertEqual(calls[-1][2]['properties']['Energy'], {'number': 4})
        self.assertEqual(calls[-1][2]['properties']['SleepHours'], {'number': None})
    def test_duplicate_day_refuses_ambiguous_write(self):
        with patch.object(self.client, 'prepare'), patch.object(self.client, 'call', return_value={'results': [{'id': '1'}, {'id': '2'}]}):
            with self.assertRaises(NotionError):
                self.client.upsert(self.entry)
    def test_schema_validation(self):
        self.client.token = 'test-token'
        self.client.database_id = '11111111-1111-1111-1111-111111111111'
        self.client.source_id = ''
        self.client.title_property = None
        source = '22222222-2222-2222-2222-222222222222'
        props = {name: {'type': 'date' if key in ('date', 'updatedAt') else 'number'} for key, name in PROPERTIES.items()}
        props['Name'] = {'type': 'title'}
        with patch.object(self.client, 'call', side_effect=[{'data_sources': [{'id': source}]}, {'properties': props}]):
            self.client.prepare()
        self.assertEqual(self.client.source_id, source)
        self.assertEqual(self.client.title_property, 'Name')

if __name__ == '__main__':
    unittest.main()
