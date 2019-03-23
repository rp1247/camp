<!DOCTYPE html>
<html>
<head>
	<title>YelpCamp</title>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
	<link rel="stylesheet" href="/stylesheets/main.css">
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
      function validateForm(){
          var title = document.forms["val"]["name"];
          var price = document.forms["val"]["price"];
          var image = document.forms["val"]["image"];
          var location = document.forms["val"]["location"];
          var description = document.forms["val"]["description"];
          
          if(typeof title.value === 'string' || title.value instanceof String){
              window.alert("Please enter price in number."); 
              title.focus(); 
              return false;
          }
          return true;
      }
  </script>
</head>
<body>
    <nav class="navbar navbar-default navbar-fixed-top">
        <div class="container-fluid">
            <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navcoll" aria-expanded="false">
              <span class="sr-only">Toggle navigation</span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
                <a class="navbar-brand" href="/">YelpCamp</a>
            </div>
            <div class="collapse navbar-collapse" id="navcoll">
                <ul class="nav navbar-nav">
                  <li><a href="/campground">Campsites</a></li>
                </ul>
                <ul class="nav navbar-nav navbar-right">
                  <% if(!currentUser){%>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/register">Sign Up</a></li>
                  <%}else{%>
                    <li><a>Logged In As <strong><%= currentUser.username %></strong></a></li>
                    <li><a href="/logout">Logout</a></li>
                  <%} %>
                </ul>
            </div>
        </div>
    </nav>
    <div class="container" id="flash">
      <% if(error && error.length > 0){ %>
        <div class="alert alert-danger">
          <p><%= error%></p>
        </div>
      <% } %>
      <% if(success && success.length > 0){ %>
      <div class="alert alert-success">
        <p><%= success%></p>
      </div>
      <%}%>
    </div>
<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>