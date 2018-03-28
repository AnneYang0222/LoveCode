//let problems = [
//    {
//      id: 1,
//      name: "Two Sum",
//     desc: 'Given an array of integers, find two numbers such that',
 //     difficulty:  "easy",
 //   },
 //   {
 //     id: 2,
 //     name: "three Sum",
  //    desc: 'Given an array of integers, find two numbers such that',
 //   difficulty:  "medium",
 // },
// {
 //  id: 3,
//       name: "Four Sum",
//       desc: 'Given an array of integers, find two numbers such that',
//       difficulty:  "hard",
//     },
//     {
//       id: 4,
//       name: "Five Sum",
//       desc: 'Given an array of integers, find two numbers such that',
//       difficulty:  "super",
//     },
//     {
//       id: 5,
//       name: "Six Sum",
//       desc: 'Given an array of integers, find two numbers such that',
//       difficulty:  "easy",
//     }
// ];

const ProblemModel = require('../models/problemModel');

const getProblems = function(){
    // console.log('In the problem service get problems');
    // return new Promise((resolve, reject) => {
    //     resolve(problems);
    // });
    return new Promise((resolve, reject) => {
         ProblemModel.find({}, (err, problems) => {
           if(err){
             reject(err);
           } else {
             resolve(problems);
           }

         });
    });
}

const getProblem = function(id){
    // console.log('In the problem service get problem');
    // return new Promise((resolve, reject) => {
    //     resolve(problems.find(problem => problem.id === id));
    //   });
    return new Promise((resolve, reject) => {
      ProblemModel.findOne({id: id}, (err, problem) => {
        if(err){
          reject(err);
        } else {
          resolve(problem);
        }

      });
 });
}

const addProblem = function(newProblem) {
  // return new Promise((resolve, reject) => {
  //     if (problems.find(problem => problem.name === newProblem.name)) {
  //         reject('Problem already exists!');
  //     } else {
  //         newProblem.id = problems.length + 1;
  //         problems.push(newProblem);
  //         resolve(newProblem);
  //     }
// });
    return new Promise((resolve, reject) => {
      // check
      ProblemModel.findOne({name: newProblem.name}, (err, data) => {
          if (data) {
              reject('Problem already exists!');
          } else {
              // save to mongodb
              ProblemModel.count({}, (err, count) => {
                  newProblem.id = count + 1;
                  const mongoProblem = new ProblemModel(newProblem);
                  mongoProblem.save();
                  resolve(mongoProblem);
              });
          }
      });
  });
}

module.exports = {
    getProblems, // when the key and value share the same name, we can just use one instaed
    getProblem, //getProblem is ok
    addProblem     
}

