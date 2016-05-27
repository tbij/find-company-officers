const Highland = require('highland')
const Request = require('request')

module.exports = parameters => {

    const http = Highland.wrapCallback((location, callback) => {
        Request(location, (error, response) => {
            const failureSource = location.query.individualName + (location.query.individualJurisdiction ? ' (' + location.query.individualJurisdiction + ')' : '')
            const failure = error ? error
                  : response.statusCode === 401 ? new Error('API token is invalid: ' + parameters.apiToken)
                  : response.statusCode >=  400 ? new Error('Error ' + response.statusCode + ': ' + failureSource)
                  : null
            callback(failure, response)
        })
    })

    function locate(entry) {
        const apiVersion = 'v0.4.5'
        if (!entry.individualName) throw new Error('No individual name given!')
        const jurisdiction = parameters.jurisdiction || entry.individualJurisdiction
        const location = 'https://api.opencorporates.com/' + apiVersion + '/officers/search'
              + '?q=' + entry.individualName.trim()
              + (jurisdiction ? '&jurisdiction_code=' + jurisdiction.trim() : '')
              + (parameters.apiToken ? '&api_token=' + parameters.apiToken : '')
        return {
            uri: location,
            query: {
                individualName: entry.individualName,
                individualJurisdiction: jurisdiction
            }
        }
    }

    function parse(response) {
        const body = JSON.parse(response.body)
        if (body.results.officers.length === 0) {
            const jurisdiction = response.request.query.individualJurisdiction ? ' (' + response.request.query.individualJurisdiction + ')' : ''
            throw new Error('Individual not found: ' + response.request.query.individualName + jurisdiction)
        }
        return body.results.officers.map(officer => {
	        return {
	            officerName: officer.officer.name,
	            officerPosition: officer.officer.position,
	            companyName: officer.officer.company.name,
	            companyNumber: officer.officer.company.company_number,
	        }
        })
    }

    function run(input) {
        return new Promise((resolve, reject) => {
            Highland([input])
                .map(locate)
                .flatMap(http)
                .flatMap(parse)
                .collect()
                .errors(reject)
                .each(resolve)
        })
    }

    return run

}
