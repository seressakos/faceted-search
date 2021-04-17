import React, { Component } from 'react';
import Card from '../Node/Card';
import Filters from './Filters'
import Pagination from './Pagination'
import Loader from '../Elements/Loader';

class FacetBlock extends Component {
  constructor() {
    super();
    this.state = {
      terms: [],
      filters: [],
      cards: [],
      urls: [],
      searchtext: '',
      loading: true,
      foundResults: true,
      appRoot: window.location.origin,
    }
  }

  getCards = (array, index, element, terms) => {
    return {
      imageurl: `${this.state.appRoot}${array[0]['included'][index]['attributes']['uri']['url']}`,
      title: element['attributes']['title'].toString(),
      sitelink: element['attributes']['field_sitelink'][0]['uri'],
      owner: element['attributes']['field_owner'] ? element['attributes']['field_owner']['value'] : false,
      alias: element['attributes']['path']['alias'],
      alt: element['relationships']['field_site_image']['data'][0]['meta']['alt'],
      category: element['relationships']['field_categories']['data'].map(e => {
        let name;
        terms.map(category => {
          if (e.id === category.id) {
            name = category.name;
          }
        });

        return name;
      }),
    };
  };

  contentFetcher = (url, currentUrl = url) => {
    this.setState({loading: true});

    Promise.all([
      fetch(`${url}`, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data => {
        const terms = [...this.state.terms];

        data[0]['data'].length < 1 ? this.setState({foundResults: false}) : this.setState({foundResults: true});

        if (url === currentUrl) {
          let cards = [];

          data[0]['data'].map((element, index) => {
            const arrayHasObject = cards.some(el => el.title === element['attributes']['title'].toString());

            if (!arrayHasObject) {
              cards = [
                ...cards,
                ...[
                  this.getCards(data, index, element, terms),
                ],
              ]
            }
          });

          this.setState({cards: cards});
        }

        let urls = [{
          'url': url,
          'active': true,
        }];

        if (data[0]['links']['next']) {
          const newUrl = data[0]['links']['next']['href'];
          urls = [...urls, ...[{
            'url': newUrl,
            'active': url === newUrl ? true : false,
          }]];

          urls.map((e, index) => {
            e.id = `pagination--item-${index}`
          });

          this.setState({
            urls: [
              ...this.state.urls,
              ...urls,
            ],
          });

          this.contentFetcher(newUrl, currentUrl);
        }

        this.setState({loading: false});
      });
  }

  inputHandler = (event) => {
    this.setState({searchtext: event.target.value});
  };

  submitHandler = (event) => {
    event.preventDefault();
    const searchText = this.state.searchtext;
    let cards = [];
    const terms = [...this.state.terms];

    if (searchText === '') {
      return
    }
    this.setState({loading: true});
    this.setState({foundResults: true});

    this.setState({
      loading: true,
      foundResults: true
    });

    Promise.all([
      fetch(`${this.state.appRoot}/jsonapi/node/nominees?filter[field_ongoing][value]=1&filter[status][value]=1&include=field_site_image&fields[file--file]=uri`, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data => {
        data[0]['data'].map((element, index) => {
          cards = [
            ...cards,
            ...[this.getCards(data, index, element, terms)],
          ]
        });

        cards = cards.filter(card => card.title.toLowerCase().includes(searchText.toLowerCase()));

        if (cards.length < 1) {
          this.setState({foundResults: false})
        }

        this.setState({cards: cards});
        this.setState({loading: false});
      })
  };

  handleCheckEvent = (event) => {
    this.setState({urls: []})

    event.target.id == 'firstfilter' ?
      this.contentFetcher(`${this.state.appRoot}/jsonapi/node/nominees?filter[field_ongoing][value]=1&filter[status][value]=1&include=field_site_image&fields[file--file]=uri`)
    :
      this.contentFetcher(`${this.state.appRoot}/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${event.target.id}&filter[field_ongoing][value]=1&filter[status][value]=1&include=field_site_image&fields[file--file]=uri`)
  };

  accordionHandler = (event) => {
    const filters = this.state.filters;

    filters.map((filter, index) => {
      if (event.target.innerHTML === filter.title) {
        filter.opened = !filters[index].opened;
      }
    });

    this.setState({filters: filters})
  };

  handlePaginaTion = (e) => {
    let id = e.currentTarget.id;
    const urls = [...this.state.urls];
    let url;
    const terms = [...this.state.terms]

    urls.map(element => {
      if (id === element.id) {
        url = element.url;
        element.active = true;
      }
      else {
        element.active = false
      }
    })

    this.setState({urls: urls})

    Promise.all([
      fetch(`${url}`, {'method': 'GET'}, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data => {
        this.setState({
          cards: [
            ...data[0]['data'].map((element, index) => {
              return this.getCards(data, index, element, terms)
            }),
          ]
        });
      });
  };

  componentDidMount() {
    Promise.all([
      fetch(`${this.state.appRoot}/jsonapi/taxonomy_term/category`, {'method': 'GET'}),
      fetch(`${this.state.appRoot}/jsonapi/taxonomy_term/category_group`, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data => {
        let filters = [{
          'title': 'Default',
          'node': [{
            'id': 'firstfilter',
            'checked': false,
            'name': 'All categories',
            'status': 'enabled',
          }]
        }];

        data[1]['data'].map(element => {
          filters = [
            ...filters,
            ...[{
              title: element['attributes']['name'],
              relatedCategories: element['relationships']['field_category']['data'].map(el => {
                return el['id'];
              }),
              opened: false,
              node: [],
            }]];
        });

        this.setState({
          terms:
            data[0]['data'].map((data, i) => {
              return {
                name: data['attributes']['name'],
                id: data['id'],
              }
            })
        });

        filters.map((el, index) => {
          if (el.relatedCategories) {
            el.relatedCategories.map(e => {
              data[0]['data'].map((data, i) => {
                if (e === data['id']) {
                  el.node.push({
                    name: data['attributes']['name'],
                    id: data['attributes']['drupal_internal__tid'],
                  });
                }
              });
            });
          }
        });

        this.setState({filters: filters});
        this.contentFetcher(`${this.state.appRoot}/jsonapi/node/nominees?filter[field_ongoing][value]=1&filter[status][value]=1&include=field_site_image&fields[file--file]=uri`);
      })
  };

  render() {
    const {state, inputHandler, submitHandler, accordionHandler, handleCheckEvent, handlePaginaTion} = this;
    const {searchtext, filters, loading, foundResults, cards, urls } = state;

    return (
      <div className="nominees-block">
        <Filters
          value={searchtext}
          inputHandler = {inputHandler}
          submitHandler = {submitHandler}
          filters={filters}
          accordionHandler = {accordionHandler}
          handleCheckEvent = {handleCheckEvent}
        />
        {loading ? <Loader/> :
          <div>
            {foundResults ?
              cards.map(card=> {
                return <Card
                  key={card.title}
                  alias={card.alias}
                  title={card.title}
                  imageUrl={card.imageurl}
                  owner={card.owner}
                  category={card.category}
                  alt={card.alt}
                />
              }) :
              <h2>No results found</h2>}
            <Pagination
              urls = {urls}
              handlePaginaTion = {handlePaginaTion}
              />
          </div>}
      </div>
    )
  }
}

export default FacetBlock;
