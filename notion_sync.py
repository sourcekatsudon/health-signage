"""Server-only Notion adapter; no token or upstream error body reaches the browser."""
import os
import uuid
import requests
from notion_config import PROPERTIES, NOTION_VERSION

class NotionError(Exception):
    pass

class NotionClient:
    def __init__(self):
        self.token = os.getenv('NOTION_TOKEN', '')
        self.database_id = os.getenv('NOTION_DATABASE_ID', '')
        self.source_id = os.getenv('NOTION_DATA_SOURCE_ID', '')
        self.title_property = None

    @property
    def configured(self):
        return bool(self.token and self.database_id)

    def call(self, method, path, payload=None):
        try:
            response = requests.request(method, 'https://api.notion.com/v1/' + path,
                headers={'Authorization': 'Bearer ' + self.token, 'Notion-Version': NOTION_VERSION},
                json=payload, timeout=12)
            if not response.ok:
                raise NotionError('Notion HTTP ' + str(response.status_code))
            return response.json()
        except (requests.RequestException, ValueError) as exc:
            raise NotionError('Notion connection failed') from exc

    def prepare(self):
        if not self.configured:
            raise NotionError('Notion is not configured')
        if self.title_property:
            return
        try:
            database_id = str(uuid.UUID(self.database_id))
        except ValueError as exc:
            raise NotionError('Invalid database ID') from exc
        sources = self.call('GET', 'databases/' + database_id)['data_sources']
        if not self.source_id:
            if len(sources) != 1:
                raise NotionError('Set NOTION_DATA_SOURCE_ID for multiple data sources')
            self.source_id = sources[0]['id']
        try:
            self.source_id = str(uuid.UUID(self.source_id))
        except ValueError as exc:
            raise NotionError('Invalid data source ID') from exc
        if self.source_id.replace('-', '') not in [s['id'].replace('-', '') for s in sources]:
            raise NotionError('Data source is not in configured database')
        props = self.call('GET', 'data_sources/' + self.source_id)['properties']
        for key, name in PROPERTIES.items():
            expected = 'date' if key in ('date', 'updatedAt') else 'number'
            if props.get(name, {}).get('type') != expected:
                raise NotionError('Missing or incorrect property: ' + name)
        self.title_property = next((name for name, prop in props.items() if prop['type'] == 'title'), None)
        if not self.title_property:
            raise NotionError('Missing title property')

    def upsert(self, entry):
        self.prepare()
        # Query on every retry, including ambiguous CREATE timeouts.
        matches = self.call('POST', 'data_sources/' + self.source_id + '/query', {
            'filter': {'property': PROPERTIES['date'], 'date': {'equals': entry['date']}}, 'page_size': 2})
        if len(matches['results']) > 1 or matches.get('has_more'):
            raise NotionError('Duplicate Date records; reconcile in Notion first')
        props = {PROPERTIES[k]: {'number': entry.get(k)} for k in PROPERTIES if k not in ('date', 'updatedAt')}
        props[PROPERTIES['date']] = {'date': {'start': entry['date']}}
        props[PROPERTIES['updatedAt']] = {'date': {'start': entry['updatedAt']}}
        if matches['results']:
            page = self.call('PATCH', 'pages/' + matches['results'][0]['id'], {'properties': props})
            return {'action': 'UPDATE', 'pageId': page['id']}
        props[self.title_property] = {'title': [{'text': {'content': entry['date']}}]}
        page = self.call('POST', 'pages', {'parent': {'type': 'data_source_id', 'data_source_id': self.source_id}, 'properties': props})
        return {'action': 'CREATE', 'pageId': page['id']}
