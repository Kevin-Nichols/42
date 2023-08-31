"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

//Related functions for jobs.

class Job {
  /** Create a new job, add to db and return the new job info.
   *
   * info should contain {title, salary, equity, companyHandle}
   *
   * create returns {id, title, salary, equity, companyHandle}
   **/
  static async create(info) {
    const res = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle) 
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
       [info.title, info.salary, info.equity, info.companyHandle,]
       );
    let newJob = res.rows[0];
    return newJob;
  }

  /** Find all jobs with optional searchFilters if needed.
   *
   * Optional searchFilters include -
   * - title (partial matches and case-insensitive)
   * - hasEquity (boolean: returns only jobs with equity > 0 if true, values < 0 are ignored)
   * - minSalary
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */
  static async findAll(searchFilters = {}) {
    let query = `SELECT jobs.id,
                        jobs.title,
                        jobs.salary,
                        jobs.equity,
                        jobs.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs 
                 LEFT JOIN companies AS c ON c.handle = jobs.company_handle`;
    const { title, minSalary, hasEquity } = searchFilters;
    let queryData = [];
    let queryExpressions = [];

    /**
     * For every search filter, we push to queryData and queryExpressions.
     * 
     * This way the correct SQL can be passed in.
     */

    if(title !== undefined) {
      queryData.push(`%${title}%`);
      queryExpressions.push(`title ILIKE $${queryData.length}`);
    }

    if(minSalary !== undefined) {
      queryData.push(minSalary);
      queryExpressions.push(`salary >= $${queryData.length}`);
    }

    if (hasEquity === true) {
      queryExpressions.push(`equity > 0`);
    }

    if (queryExpressions.length > 0) {
      query += " WHERE " + queryExpressions.join(" AND ");
    }

    // Finish SQL query and return correct result.
    query += " ORDER BY title";
    const jobsRes = await db.query(query, queryData);

    return jobsRes.rows;
  }

   /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;