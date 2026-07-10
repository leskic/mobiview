# encoding: UTF-8

require "json"

module MobiViewExporter

  module SceneWriter

    extend self

    def write(pieces, folder)

      file = File.join(folder, "scene.json")

      scene = SceneBuilder.build(pieces)

      File.open(file, "w:utf-8") do |f|
        f.write(JSON.pretty_generate(scene))
      end

      file

    end

  end

end